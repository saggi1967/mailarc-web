import { createTheme } from "@mui/material/styles";

// Schlichtes, professionelles Theme (Light + Dark folgt System).
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2b6cb0" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: ['"Helvetica Neue"', "Arial", "system-ui", "sans-serif"].join(","),
  },
});
