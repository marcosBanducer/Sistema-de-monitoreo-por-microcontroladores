function simularConsumo(potenciaGenerada) {
  const consumoBase = 5 + Math.random() * 10;
  const factorCarga = 0.4 + Math.random() * 0.8;

  const consumo = Number(
    (consumoBase + potenciaGenerada * factorCarga).toFixed(2)
  );

  const excedente = Number(
    Math.max(0, potenciaGenerada - consumo).toFixed(2)
  );

  const deficit = Number(
    Math.max(0, consumo - potenciaGenerada).toFixed(2)
  );

  return {
    consumo,
    excedente,
    deficit,
    origenConsumo: "SIMULADO"
  };
}

module.exports = { simularConsumo };