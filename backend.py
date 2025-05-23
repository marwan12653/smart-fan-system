import paho.mqtt.client as mqtt
from flask import Flask, jsonify,request
from flask_cors import CORS

BROKER = "192.168.1.83"  # pi's ip 
TOPIC_DATA = "smartfan/data"
TOPIC_CONTROL = "smartfan/control"
currentTemp = 0.0
currentHum = 0.0


def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT Broker with result code "+str(rc))
    client.subscribe(TOPIC_DATA)

def on_message(client, userdata, msg):
    global currentTemp, currentHum
    payload = msg.payload.decode()
    temp, hum = payload.split(",")
    currentTemp, currentHum = temp, hum

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, 1883)


app = Flask(__name__)
CORS(app)

@app.route('/get_data')
def get_data():
    return jsonify({
        "temperature": currentTemp,
        "humidity": currentHum
    })

@app.route('/control', methods=['POST'])
def control():
    
    req = request.get_json()
    if not req:
        return jsonify({"status": "error", "message": "Invalid request"}), 400
    command = req.get("command")
    print(command)
    if command:
        if command == "auto":
            client.publish(TOPIC_CONTROL, command)
        elif command == "manual":
            speed = req.get("speed")
            print(speed)
            if speed is not None:
                client.publish(TOPIC_CONTROL, f"manual speed={speed}")
            else:
                client.publish(TOPIC_CONTROL, "manual speed=0")
        return jsonify({"status": "success", "command": command})
    else:
        return jsonify({"status": "error", "message": "No command provided"}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5111, debug=True)
    client.loop_start()