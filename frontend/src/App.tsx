import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Typography,
  Card,
  CardContent,
  Switch,
  Slider,
  Button,
  FormControlLabel,
  Box,
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

export default function SmartCoolingUI() {
  const [mode, setMode] = useState("auto");
  const [temperature, setTemperature] = useState(26);
  const [recommendedFanLevel, setRecommendedFanLevel] = useState(1);
  const [manualFanLevel, setManualFanLevel] = useState(0);

  useEffect(() => {
    if (mode === "auto") {
      if (temperature < 24) setRecommendedFanLevel(0);
      else if (temperature < 26) setRecommendedFanLevel(1);
      else if (temperature < 28) setRecommendedFanLevel(2);
      else setRecommendedFanLevel(3);
    }
  }, [temperature, mode]);

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

  return (
    <Container>
      <Card sx={{ width: 400, boxShadow: 6, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            Smart Room Cooling
          </Typography>

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

          <Box mb={3}>
            <Typography gutterBottom>
              Room Temperature: {temperature}°C
            </Typography>
            <Slider
              value={temperature}
              min={16}
              max={35}
              step={0.5}
              onChange={(_e, val) => setTemperature(val)}
              valueLabelDisplay="auto"
            />
          </Box>

          {mode === "auto" ? (
            <Typography>
              Recommended Fan Level: {recommendedFanLevel}
            </Typography>
          ) : (
            <Box mb={2}>
              <Typography gutterBottom>
                Manual Fan Level: {manualFanLevel}
              </Typography>
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

          <Button variant="contained" color="primary" fullWidth>
            Apply Settings
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
