import React from "react";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";

const GameParameterCardHeader = ({ isAVG, pacientName, condition, height, weight }) => {
  return (
    <Box
      sx={{
        backgroundColor: '#F9FAFC',
        paddingLeft: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        border: "none",
        borderBottom: "1px solid #E9EAED",
        height: 'auto',
        padding: 2
      }}
    >
      <Typography variant="h6" sx={{ color: "#11192A", fontSize: 17 }}>
        {isAVG ? 'Media das Avaliações' : pacientName}
      </Typography>
      {!isAVG && (
        <>
          {condition && <Typography variant="body2">Condição: {condition}</Typography>}
          {height && <Typography variant="body2">Altura: {height} cm</Typography>}
          {weight && <Typography variant="body2">Peso: {weight} kg</Typography>}
        </>
      )}
    </Box>
  );
};

export default GameParameterCardHeader;
