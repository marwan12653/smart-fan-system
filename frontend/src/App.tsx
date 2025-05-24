import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Typography,
  Card,
  CardContent,
  Switch,
  Slider,
  FormControlLabel,
  Box,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/system";

const API_URL = "http://localhost:5111/";

const Container = styled("div")({
  minHeight: "100vh",
  background: "linear-gradient(to bottom right, #cfe0fc, #dee9fd)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "2rem",
});

const getTempColor = (temp: number) => {
  if (temp < 24) return "#4caf50";
  if (temp < 28) return "#ff9800";
  return "#f44336";
};

const getHumidityColor = (hum: number) => {
  if (hum < 30) return "#f44336";
  if (hum <= 60) return "#4caf50";
  return "#ff9800";
};

const formatDecimal = (value: number) => {
  return Number.isFinite(value) ? value.toFixed(1) : "N/A";
};

export default function SmartCoolingUI() {
  const [mode, setMode] = useState("auto");
  const [temperature, setTemperature] = useState<number>(26);
  const [humidity, setHumidity] = useState<number>(50);
  const [manualFanLevel, setManualFanLevel] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}get_data`);
        const res = response.data;
        // Ensure numeric values
        setTemperature(parseFloat(res.temperature));
        setHumidity(parseFloat(res.humidity));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleModeChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newMode = event.target.checked ? "auto" : "manual";
    setMode(newMode);
    await axios.post(`${API_URL}control`, { command: newMode });
  };

  const handleManualFanLevelChange = async (newValue: number) => {
    setManualFanLevel(newValue);
    await axios.post(`${API_URL}control`, {
      command: "manual",
      speed: newValue,
    });
  };

  // Derive fan speed based on temperature if in auto mode
  const fanSpeed =
    mode === "manual"
      ? manualFanLevel
      : temperature > 35
      ? 3
      : temperature > 30
      ? 2
      : temperature > 25
      ? 1
      : 0;

  return (
    <Container>
      <Card
        sx={{ width: 400, boxShadow: 6, borderRadius: 4, paddingBottom: 2 }}
      >
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            Smart Room Cooling
          </Typography>

          <Box display="flex" justifyContent="space-around" mb={3}>
            <Box textAlign="center">
              <Box position="relative" display="inline-flex">
                <CircularProgress
                  variant="determinate"
                  value={(temperature / 40) * 100}
                  size={100}
                  thickness={5}
                  sx={{
                    color: getTempColor(temperature),
                    "& .MuiCircularProgress-circle": {
                      strokeLinecap: "round",
                    },
                  }}
                />
                <Box
                  top={0}
                  left={0}
                  bottom={0}
                  right={0}
                  position="absolute"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography variant="h6">
                    {formatDecimal(temperature)}°C
                  </Typography>
                </Box>
              </Box>
              <Typography mt={1}>🌡️ Temperature</Typography>
            </Box>

            <Box textAlign="center">
              <Box position="relative" display="inline-flex">
                <CircularProgress
                  variant="determinate"
                  value={humidity}
                  size={100}
                  thickness={5}
                  sx={{
                    color: getHumidityColor(humidity),
                    "& .MuiCircularProgress-circle": {
                      strokeLinecap: "round",
                    },
                  }}
                />
                <Box
                  top={0}
                  left={0}
                  bottom={0}
                  right={0}
                  position="absolute"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography variant="h6">
                    {formatDecimal(humidity)}%
                  </Typography>
                </Box>
              </Box>
              <Typography mt={1}>💧 Humidity</Typography>
            </Box>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={mode === "auto"}
                onChange={(e) => handleModeChange(e)}
              />
            }
            label={`Mode: ${mode === "auto" ? "Automatic" : "Manual"}`}
            sx={{ marginBottom: 3 }}
          />

          <Typography>
            Fan Speed: <strong>{fanSpeed}</strong>
          </Typography>

          {mode === "manual" && (
            <Box mb={2}>
              <Typography gutterBottom>Manual Fan Level</Typography>
              <Slider
                value={manualFanLevel}
                min={0}
                max={100}
                step={1}
                onChange={(_e, val) => handleManualFanLevelChange(val)}
                valueLabelDisplay="auto"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
