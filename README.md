# Smart Fan System

This project is a smart fan system that controls a fan based on temperature and humidity readings from a DHT22 sensor connected to a Raspberry Pi. It allows for both automatic fan control based on predefined temperature thresholds and manual control via a web interface.

The system uses MQTT for communication between the Raspberry Pi, a backend server, and a frontend web application.

## Core Components

* **Hardware (Raspberry Pi):**
    * Raspberry Pi (Controls the fan and reads sensor data) 
    * DHT22 Temperature and Humidity Sensor 
    * L298N Motor Driver (to control the fan speed) 
* **Backend:**
    * Python with Flask (Provides an API to get sensor data and send control commands) 
    * Paho-MQTT (for MQTT communication) 
* **Frontend:**
    * React with TypeScript and Vite 
    * Material UI (MUI) for UI components 
    * Axios (for making API requests) 
* **Communication Protocol:** MQTT 

## System Setup

### 1. Hardware Setup (Raspberry Pi)

* Connect the DHT22 sensor data pin to GPIO17. 
* Connect the L298N motor driver:
    * IN1 to GPIO24 
    * IN2 to GPIO25 
    * ENA to GPIO18 (PWM-capable pin) 
* Connect your fan to the L298N motor output.
* Power the Raspberry Pi and the L298N appropriately.

### 2. Raspberry Pi Software

* **Install Dependencies:**
    ```bash
    pip install Adafruit_DHT RPi.GPIO paho-mqtt
    ```
* **Setup MQTT Broker (Mosquitto):**
    Follow the instructions in `extra_steps.txt` to install and enable Mosquitto on your Raspberry Pi. This will set up a local MQTT broker. The `rasp.py` script is configured to connect to `localhost`. 

### 3. Backend Setup

* Clone this repository.
* **Install Python Dependencies:**
    ```bash
    pip install Flask Flask-CORS paho-mqtt
    ```
* **Configure MQTT Broker:**
    The `backend.py` script is currently configured to use a HiveMQ cloud broker. If you are using the local Mosquitto broker on your Raspberry Pi (as set up in `extra_steps.txt` and used by `rasp.py`), you will need to **modify `backend.py`**:
    * Change the `BROKER` variable to the IP address of your Raspberry Pi.
    * Remove or comment out `client.username_pw_set(USERNAME, PASSWORD)` and `client.tls_set()` if your local broker doesn't require them (default Mosquitto setup usually doesn't).

### 4. Frontend Setup

* Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
* Install dependencies:
    ```bash
    npm install
    ```
    (or `yarn install` if you use Yarn)

## Running the System

1.  **Start MQTT Broker:** Ensure the Mosquitto broker is running on your Raspberry Pi (it should start automatically if enabled). 
2.  **Run Raspberry Pi Script:**
    On your Raspberry Pi, execute:
    ```bash
    python rasp.py
    ```
3.  **Run Backend Server:**
    On the machine where you set up the backend (this could be the Pi or another computer), execute:
    ```bash
    python backend.py
    ```
    The backend API will be available at `http://<your-backend-ip>:5111`. 
4.  **Run Frontend Application:**
    In the `frontend` directory, run:
    ```bash
    npm run dev
    ```
    
    The frontend will typically be accessible at `http://localhost:5173` (Vite will show the exact URL). The frontend is configured to connect to the backend API at `http://localhost:5111/`. If your backend is running on a different IP, update the `API_URL` in `frontend/src/App.tsx`. 

## How It Works

1.  The `rasp.py` script on the Raspberry Pi reads temperature and humidity from the DHT22 sensor. 
2.  This data is published to the MQTT topic `smartfan/data`. 
3.  The Flask `backend.py` script subscribes to `smartfan/data` to receive sensor readings. 
4.  The frontend React application (`App.tsx`) fetches this data from the backend's `/get_data` API endpoint. 
5.  Users can interact with the frontend to switch between "auto" and "manual" modes or set a manual fan speed. 
6.  Control commands are sent from the frontend to the backend's `/control` API endpoint. 
7.  The backend publishes these commands to the MQTT topic `smartfan/control`. 
8.  The `rasp.py` script subscribes to `smartfan/control` and adjusts the fan speed accordingly using the L298N motor driver. 
    * In **auto mode**, fan speed is adjusted based on temperature thresholds:
        * `< TEMP_LOW (25°C)`: Fan OFF
        * `< TEMP_MED (30°C)`: Low Speed (50%)
        * `< TEMP_HIGH (35°C)`: Medium Speed (75%)
        * `>= TEMP_HIGH (35°C)`: High Speed (100%)
        
    * In **manual mode**, fan speed is set to the level specified from the frontend. 

---

This README is based on the provided files. You can expand it with more details, troubleshooting, or contribution guidelines as needed.
