import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import GameParameterCard from "../../components/game-parameter-card";
import { fetchGameParameterNeighbor, createGameParameter, getGameParameter } from "../../services/api/gameParameterNeighbor";
import { useMyContext } from "../../providers/MyContext";

import { makeStyles } from "@mui/styles";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

const useStyles = makeStyles((theme) => ({
  button: {
    color: "#fff",
    backgroundColor: "#11192A",
    "&:hover": {
      backgroundColor: "#11192A",
      opacity: 0.7,
      color: "white",
    },
  },
  input: {
    color: "#11192A",
  }
}));


const GameConfigurationCreatePage = () => {
  const context = useMyContext()
  const [gameParameterNeighborInformations, setGameParameterNeighborInformations] = useState([]);

  const classes = useStyles();
  const [phase, setPhase] = useState('');
  const [stageId, setStageId] = useState('');
  const [level, setLevel] = useState('');
  const [Loops, setLoops] = useState('');
  const [objectSpeedFactor, setObjectSpeedFactor] = useState('');
  const [heightIncrement, setHeightIncrement] = useState('');
  const [heightUpThreshold, setHeightUpThreshold] = useState('');
  const [heightDownThreshold, setHeightDownThreshold] = useState('');
  const [sizeIncrement, setSizeIncrement] = useState('');
  const [sizeUpThreshold, setSizeUpThreshold] = useState('');
  const [sizeDownThreshold, setSizeDownThreshold] = useState('');
  const [gameScript, setGameScript] = useState('');

  useEffect(() => {
    const setInputsPacientGameParameter = (pacientGameParameter) => {
      if (pacientGameParameter) {
        var stringifyGameScript = translateGameScript(pacientGameParameter?.gameScript)
        setPhase(pacientGameParameter?.phase || "");
        setStageId(pacientGameParameter?.stageId || "");
        setLevel(pacientGameParameter?.level || "");
        setLoops(pacientGameParameter?.Loops || "");
        setObjectSpeedFactor(pacientGameParameter?.ObjectSpeedFactor?.$numberDecimal || "");
        setHeightIncrement(pacientGameParameter?.HeightIncrement?.$numberDecimal || "");
        setHeightUpThreshold(pacientGameParameter?.HeightUpThreshold?.$numberDecimal || "");
        setHeightDownThreshold(pacientGameParameter?.HeightDownThreshold?.$numberDecimal || "");
        setSizeIncrement(pacientGameParameter?.SizeIncrement?.$numberDecimal || "");
        setSizeUpThreshold(pacientGameParameter?.SizeUpThreshold?.$numberDecimal || "");
        setSizeDownThreshold(pacientGameParameter?.SizeDownThreshold?.$numberDecimal || "");
        setGameScript(stringifyGameScript || "");
      }
    }
    async function getGameParameterNeighbor() {
      context.setLoading(true);
      const pacientGameParameteResult = await getGameParameter(context.patientId)
      setInputsPacientGameParameter(pacientGameParameteResult.data.data[0])
      const result = await fetchGameParameterNeighbor(context.patientId);
      setGameParameterNeighborInformations([...result.data.data]);
      context.setLoading(false);
    };
    if (context.patientId) {
      getGameParameterNeighbor();
    }
  }, [context.patientId]);

  if (!context.patientId) {
    return (<Typography variant="h2" sx={{ fontSize: 20 }}>Um paciente precisa ser selecionado!</Typography>);
  }

  const translateGameScript = (pacientGameParameter) => {
    var stringifyGameScript = ""
    pacientGameParameter?.forEach(function (attr, index) {
      if (index + 1 === pacientGameParameter.length) {
        stringifyGameScript += (attr.ObjectType + ";" + attr.DifficultyFactor + ";" + attr.PositionYFactor + ";" + attr.PositionXSpacing)
      } else {
        stringifyGameScript += (attr.ObjectType + ";" + attr.DifficultyFactor + ";" + attr.PositionYFactor + ";" + attr.PositionXSpacing + "\r\n")
      }
    })
    return stringifyGameScript
  }

  const selectNeighborInformation = (index) => {
    setPhase(document.getElementById(`phase${index}`).innerText);
    setStageId(document.getElementById(`stageId${index}`).innerText);
    setLevel(document.getElementById(`level${index}`).innerText);
    setLoops(document.getElementById(`Loops${index}`).innerText);
    setObjectSpeedFactor(document.getElementById(`objectSpeedFactor${index}`).innerText);
    setHeightIncrement(document.getElementById(`heightIncrement${index}`).innerText);
    setHeightUpThreshold(document.getElementById(`heightUpThreshold${index}`).innerText);
    setHeightDownThreshold(document.getElementById(`heightDownThreshold${index}`).innerText);
    setSizeIncrement(document.getElementById(`sizeIncrement${index}`).innerText);
    setSizeUpThreshold(document.getElementById(`sizeUpThreshold${index}`).innerText);
    setSizeDownThreshold(document.getElementById(`sizeDownThreshold${index}`).innerText);
    setGameScript(document.getElementById(`gameScript${index}`)?.innerText?.replace(" ", "\n"));
    context.addNotification('success',  'Configurações selecionadas');
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!context.patientId) {
      context.addNotification('error', 'Nenhum paciente selecionados')
    } else {
      try {
        const gameScriptEdit = document?.getElementById('gameScript')?.value?.split("\n")?.map(function (template) {
          return {
            "ObjectType": template.split(";")[0],
            "DifficultyFactor": template.split(";")[1],
            "PositionYFactor": template.split(";")[2],
            "PositionXSpacing": template.split(";")[3]
          }
        })
        const gameParameter = {
          pacientId: context.patientId,
          "stageId": stageId,
          "phase": phase,
          "level": level,
          "ObjectSpeedFactor": objectSpeedFactor,
          "HeightIncrement": heightIncrement,
          "HeightUpThreshold": heightUpThreshold,
          "HeightDownThreshold": heightDownThreshold,
          "SizeIncrement": sizeIncrement,
          "SizeUpThreshold": sizeUpThreshold,
          "SizeDownThreshold": sizeDownThreshold,
          "gameScript": gameScriptEdit,
          "Loops": Loops,
        };
        await createGameParameter(context, gameParameter)
        context.addNotification('success', 'Salvo com Sucesso');
      } catch (error) { }
    };
  }

  const maxAndMinInput = (functionName, event, max = 5, min = 1) => {
    const value = parseFloat(event.target.value, 10);
    if (value > max) {
      return functionName(max.toFixed(2));
    } else if (value < min) {
      return functionName(min.toFixed(2));
    } else if (value) {
      return functionName(value.toFixed(2));
    } else {
      return functionName("");
    }
  }

  return (
    <Box
      sx={{
        marginTop: 1,
        display: "flex",
        flexDirection: "column",
        alignContent: "center",
        justifyContent: "space-around",
        alignItems: "center",
        marginLeft: { xs: -2, md: 0 },
        marginRight: { xs: -2, md: 0 }
      }}
    >
      <Typography variant="h2" sx={{ fontSize: 20, fontWeight: "bold", letterSpacing: "1px", color: '#11192A' }}>
        Configuração de jogo para o paciente
      </Typography>

      <Box
        sx={{
          flex: 'auto',
          boxSizing: 'border-box',
          boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
          minWidth: 0,
          maxWidth: 800,
          backgroundColor: "white",
          color: "black",
          mt: 4,
          display: "flex",
          flexWrap: "wrap",
          alignContent: "center",
          flexDirection: "row",
          justifyContent: "space-around",
        }}
        component="form"
        onSubmit={handleSubmit}
      >
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderRight: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField sx={{ width: '90%' }} required label="Fase" margin="normal" type='number' name="phase" id='phase' color="borderInput" InputProps={{ classes: { input: classes.input } }} value={phase}
              onChange={(e) => maxAndMinInput(setPhase, e, 4, 1)} />
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderLeft: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField sx={{ width: '90%' }} required label="Nivel do Estágio" margin="normal" type='number' name="stageId" id='stageId' color="borderInput" InputProps={{ classes: { input: classes.input } }} value={stageId}
              onChange={(e) => maxAndMinInput(setStageId, e, 4, 1)} />
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderRight: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField sx={{ width: '90%' }} required label="Level" margin="normal" type='number' name="level" id='level' color="borderInput" InputProps={{ classes: { input: classes.input } }} value={level}
              onChange={(e) => maxAndMinInput(setLevel, e, 99, 1)} />
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderLeft: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField sx={{ width: '90%' }} required label="Loops" margin="normal" type='number' name="Loops" id='Loops' color="borderInput" InputProps={{ classes: { input: classes.input } }} value={Loops}
              onChange={(e) => maxAndMinInput(setLoops, e, 99, 1)} />
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderRight: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField sx={{ width: '90%' }} required label="Velocidade dos Objetos" margin="normal" type='number' name="objectSpeedFactor" id='objectSpeedFactor' color="borderInput" inputProps={{ step: "0.5" }} InputProps={{ classes: { input: classes.input } }} value={objectSpeedFactor}
              onChange={(e) => maxAndMinInput(setObjectSpeedFactor, e, 3, 1)} />
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderLeft: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField sx={{ width: '90%' }} required label="Incremento performance (Altura)" margin="normal" type='number' name="heightIncrement" id='heightIncrement' color="borderInput" inputProps={{ step: "0.1" }} InputProps={{ classes: { input: classes.input } }} value={heightIncrement}
              onChange={(e) => maxAndMinInput(setHeightIncrement, e, 1, 0)} />
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderRight: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField sx={{ width: '90%' }} required label="Elevações necessárias (Altura)" margin="normal" type='number' name="heightUpThreshold" id='heightUpThreshold' color="borderInput" inputProps={{ step: "0.5" }} InputProps={{ classes: { input: classes.input } }} value={heightUpThreshold}
              onChange={(e) => maxAndMinInput(setHeightUpThreshold, e, 5, 0)} />
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderLeft: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField sx={{ width: '90%' }} required label="Descidas necessárias (Altura)" margin="normal" type='number' name="heightDownThreshold" id='heightDownThreshold' color="borderInput" inputProps={{ step: "0.5" }} InputProps={{ classes: { input: classes.input } }} value={heightDownThreshold}
              onChange={(e) => maxAndMinInput(setHeightDownThreshold, e, 5, 0)} />
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderRight: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField sx={{ width: '90%' }} required label="Incremento performance (Tamanho)" margin="normal" type='number' name="sizeIncrement" id='sizeIncrement' color="borderInput" inputProps={{ step: "0.1" }} InputProps={{ classes: { input: classes.input } }} value={sizeIncrement}
              onChange={(e) => maxAndMinInput(setSizeIncrement, e, 1, 0)} />
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderLeft: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField sx={{ width: '90%' }} required label="Elevações necessárias (Tamanho)" margin="normal" type='number' name="sizeUpThreshold" id='sizeUpThreshold' color="borderInput" inputProps={{ step: "0.5" }} InputProps={{ classes: { input: classes.input } }} value={sizeUpThreshold}
              onChange={(e) => maxAndMinInput(setSizeUpThreshold, e, 5, 0)} />
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderRight: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField sx={{ width: '90%' }} required label="Descidas necessárias (Tamanho)" margin="normal" type='number' name="sizeDownThreshold" id='sizeDownThreshold' color="borderInput" inputProps={{ step: "0.5" }} InputProps={{ classes: { input: classes.input } }} value={sizeDownThreshold}
              onChange={(e) => maxAndMinInput(setSizeDownThreshold, e, 5, 0)} />
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderLeft: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '50%',
            height: 100,
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
          </Box>
        </Box>
        <Box
          sx={{
            paddingLeft: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            border: "none",
            borderRight: "1px solid #E9EAED",
            borderBottom: "1px solid #E9EAED",
            width: '100%',
            height: "100%",
          }}
        >
          <Box sx={{ width: '100%', display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextField multiline rows={3} sx={{ width: '100%' }} required label="Roteiro do Jogo" margin="normal" name="gameScript" id='gameScript' color="borderInput" inputProps={{ step: "0.5" }} InputProps={{ classes: { input: classes.input } }} value={gameScript}
              onChange={(e) => setGameScript(e.target.value)} />
          </Box>
        </Box>
        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          className={classes.button}
        >
          Salvar Configuração
        </Button>
      </Box>
      <Typography variant="h2" sx={{ mt: 4, fontSize: 20, fontWeight: "bold", letterSpacing: "1px" }}>
        Recomendações criadas pela IA
      </Typography>
      <Box
        sx={{
          marginTop: 5,
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          flexFlow: "wrap"
        }}
      >
        {gameParameterNeighborInformations.map((gameParameterNeighborInformation, index) => (
          <GameParameterCard gameParameter={gameParameterNeighborInformation} index={index} selectNeighborInformation={selectNeighborInformation} key={`gameParameter${index}`} />
        ))}
      </Box>
    </Box>
  );
}

export default GameConfigurationCreatePage;
