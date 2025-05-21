import paho.mqtt.client as mqtt

BROKER = ""  # pi's ip 
TOPIC_DATA = "smartfan/data"
TOPIC_CONTROL = "smartfan/control"

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT Broker with result code "+str(rc))
    client.subscribe(TOPIC_DATA)

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    temp, hum = payload.split(",")
    print(f"Sensor: Temp = {temp}°C | Humidity = {hum}%")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, 1883)
client.loop_start()

print("Backend MQTT Client started. Type commands to control fan:")
print("Examples:")
print("  auto           (auto mode)")
print("  manual on      (manual full speed)")
print("  manual off     (manual off)")
print("  manual speed=50 (manual speed 50%)")

try:
    while True:
        cmd = input("Enter command: ").strip()
        if cmd:
            client.publish(TOPIC_CONTROL, cmd)

except KeyboardInterrupt:
    print("Exiting backend...")

finally:
    client.loop_stop()
    client.disconnect()
