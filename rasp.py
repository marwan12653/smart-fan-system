import Adafruit_DHT
import RPi.GPIO as GPIO
import time
import paho.mqtt.client as mqtt



# === Pin Definitions ===
DHT_SENSOR = Adafruit_DHT.DHT22
DHT_PIN = 17       # GPIO17 - DHT22 Data
IN1 = 24           # GPIO24 - L298N IN1
IN2 = 25           # GPIO25 - L298N IN2
ENA = 18           # GPIO18 - L298N ENA (PWM-capable)

# === Temperature Thresholds ===
TEMP_LOW = 25.0    # Below this = fan OFF
TEMP_MED = 30.0    # Medium speed
TEMP_HIGH = 35.0   # Full speed

# === MQTT Setup ===
BROKER = "localhost"  # bec the broker runs on Pi (after installing the command in the txt file)
TOPIC_DATA = "smartfan/data"
TOPIC_CONTROL = "smartfan/control"

# === GPIO Setup ===
GPIO.setmode(GPIO.BCM)
GPIO.setup(IN1, GPIO.OUT)
GPIO.setup(IN2, GPIO.OUT)
GPIO.setup(ENA, GPIO.OUT)

# Start PWM at 1kHz
fan_pwm = GPIO.PWM(ENA, 1000)
fan_pwm.start(0)

manual_mode = False
manual_speed = 0

def set_fan_state(temp):
    """Adjust fan speed based on temperature."""
    global manual_mode, manual_speed

    if manual_mode:
        print(f"Manual Fan Speed: {manual_speed}%")
        if manual_speed == 0:
            fan_pwm.ChangeDutyCycle(0)
            GPIO.output(IN1, GPIO.LOW)
            GPIO.output(IN2, GPIO.LOW)
        else:
            GPIO.output(IN1, GPIO.HIGH)
            GPIO.output(IN2, GPIO.LOW)
            fan_pwm.ChangeDutyCycle(manual_speed)
        return

    if temp < TEMP_LOW:
        print("Temperature low. Fan OFF.")
        fan_pwm.ChangeDutyCycle(0)
        GPIO.output(IN1, GPIO.LOW)
        GPIO.output(IN2, GPIO.LOW)
    else:
        # Set forward direction
        GPIO.output(IN1, GPIO.HIGH)
        GPIO.output(IN2, GPIO.LOW)

        if temp < TEMP_MED:
            print("Fan ON - Low Speed (50%)")
            fan_pwm.ChangeDutyCycle(50)
        elif temp < TEMP_HIGH:
            print("Fan ON - Medium Speed (75%)")
            fan_pwm.ChangeDutyCycle(75)
        else:
            print("Fan ON - High Speed (100%)")
            fan_pwm.ChangeDutyCycle(100)

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT Broker with result code "+str(rc))
    client.subscribe(TOPIC_CONTROL)

def on_message(client, userdata, msg):
    global manual_mode, manual_speed
    print(f"Received control message: {msg.payload.decode()}")
    command = msg.payload.decode().lower()

    if command == "auto":
        manual_mode = False
    elif command.startswith("manual speed="):
        manual_mode = True
        try:
            speed_val = int(command.split("=")[1])
            manual_speed = max(0, min(100, speed_val))
        except:
            print("Invalid speed value received.")
    elif command == "manual on":
        manual_mode = True
        manual_speed = 100
    elif command == "manual off":
        manual_mode = True
        manual_speed = 0
    else:
        print("Unknown command received.")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, 1883)
client.loop_start()

try:
    print("Starting Smart Fan Control with MQTT...")
    while True:
        humidity, temperature = Adafruit_DHT.read_retry(DHT_SENSOR, DHT_PIN)

        if temperature is not None and humidity is not None:
            print(f"Temp: {temperature:.1f}°C  Humidity: {humidity:.1f}%")
            client.publish(TOPIC_DATA, f"{temperature:.1f},{humidity:.1f}")
            if not manual_mode:
                set_fan_state(temperature)
        else:
            print("Failed to read from DHT22 sensor.")

        time.sleep(2)

except KeyboardInterrupt:
    print("Exiting program...")

finally:
    fan_pwm.stop()
    GPIO.cleanup()
    client.loop_stop()
    client.disconnect()
