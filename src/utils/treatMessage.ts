// tratar mensagem:
// -> ajuste de comandos:
//  /char Ellie -> (LILA) Ellie:
//  o LILA fica clareado (mais discreto)

//  /color lista de cores
//   muda a cor do user e nos dados (como tá no exemplo de Léo)

//  #d20 + mod
//  LILA rolou #d20 + mod que resultou em soma (resultado + mod) - modelo Léo
//  crítico é só no #d20

//  /- ou ---
//  passa uma linha embaixo

interface Extras {
  isColor: boolean;
  color: string;
  isChangingChar: boolean;
  char: string;
  isPassingLine: boolean;
  finalMessage: string;
  newMessageWriter: string;
}

export function getRandomIntInclusive(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}

export function isNumeric(str: string) {
  const pattern = /^\d+$/;

  if (pattern.test(str)) {
    return true;
  } else {
    return false;
  }
}

const TreatMessage = (color: string, char: string, newMessage: any): Extras => {
  let isRoll = false,
    dice = 0,
    diceResult = 0,
    signal = "",
    mod = 0,
    finalResult = 0,
    isColor = false,
    isChangingChar = false,
    isPassingLine = false,
    finalMessage = newMessage,
    newMessageWriter = "user";

  if (newMessage.startsWith("#d")) {
    isRoll = true;

    // Tudo depois do "#d"
    const afterD = newMessage.slice(2).trim(); // pega "20 + 10"

    // Regex para capturar dado + modificador opcional

    const [expression, ...extraParts] = afterD.split(" ");
    // Junta o resto (pode ser várias palavras) e colore os #extras
    const extraText = extraParts
      .filter((word: string) => word.startsWith("#")) // só pega palavras que começam com #
      .map((word: string) => `<span style="color: ${color}">${word}</span>`)
      .join(" ");

    // Regex para capturar dado + modificador
    const match = afterD.match(/^(\d+)\s*([+-])?\s*(\d+)?/);

    if (!match) {
      finalMessage = "Formato inválido! Use ex: #d20, #d20+1, #d20 -2";
    } else {
      const [, dice, signal, mod] = match;

      console.log("dice :>> ", dice);
      console.log("signal :>> ", signal);
      console.log("mod :>> ", mod);

      diceResult = getRandomIntInclusive(1, dice);

      if (signal && mod) {
        finalResult =
          signal === "+"
            ? Number(diceResult) + Number(mod)
            : Number(diceResult) - Number(mod);
      } else {
        finalResult = diceResult;
      }

      // Mensagem base
      finalMessage =
        signal && mod
          ? `rolou um <span style="color: ${color}">#d${dice} ${signal} ${mod}</span> e tirou <b>${finalResult}</b>`
          : `rolou um <span style="color: ${color}">#d${dice}</span> e tirou <b>${finalResult}</b>`;

      // Adiciona o dado bruto e modificador entre parênteses (se não for natural)
      if (diceResult !== 1 && diceResult !== 20 && signal && mod) {
        finalMessage += ` (<span style="color: ${color}">${diceResult} ${signal} ${mod}</span>)`;
      }

      // Trata natural 1 ou 20
      if (diceResult === 1 || diceResult === 20) {
        finalMessage += signal
          ? ` (<span style="color: ${color}"><b style="color: ${color}">natural ${diceResult}</b> ${signal} ${mod}</span>)`
          : ` (<span style="color: ${color}"><b style="color: ${color}">natural ${diceResult}</b></span>)`;
      }

      // Se tiver extra (#percepção, #força, etc), adiciona no final
      if (extraText) {
        finalMessage += ` ${extraText}`;
      }
    }
  } else if (newMessage.startsWith("/char")) {
    isChangingChar = true;
    console.log("newMessage :>> ", newMessage);
    char = newMessage.split("/char ")[1];
    console.log("char :>> ", char);
    finalMessage = `atualizou char para <b>${char}</b>`;
  } else if (newMessage.startsWith("/color")) {
    console.log("newMessage :>> ", newMessage);
    isColor = true;
    color = newMessage.split(" ")[1].split(" ")[0];
    const colorName = newMessage.split("- ")[1];
    finalMessage = `atualizou cor para <span style="color:${color}">${colorName}</span>`;
  } else if (newMessage.startsWith("/-") || newMessage.startsWith("---")) {
    isPassingLine = true;
    finalMessage = `<hr>`;
  } else if (newMessage.startsWith("/b")) {
    finalMessage = `<b>${newMessage.split("/b ")[1]}</b>`;
  }

  if (isColor || isChangingChar || isPassingLine || isRoll)
    newMessageWriter = "adm";

  return {
    isColor,
    color,
    isChangingChar,
    char,
    isPassingLine,
    finalMessage,
    newMessageWriter,
  };
};

export default TreatMessage;
