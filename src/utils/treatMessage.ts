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
  char: string | undefined;
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

const TreatMessage = (color: string, newMessage: any): Extras => {
  let isRoll = false,
    dice = 0,
    diceResult = 0,
    signal = "",
    mod = 0,
    finalResult = 0,
    isColor = false,
    isChangingChar = false,
    char,
    isPassingLine = false,
    finalMessage = newMessage,
    newMessageWriter = "user";

  if (newMessage.startsWith("#d")) {
    isRoll = true;

    [dice, signal, mod] = newMessage.split("#d")[1].split(" ");

    diceResult = getRandomIntInclusive(1, dice);

    if (signal && mod)
      finalResult =
        signal === "+"
          ? Number(diceResult) + Number(mod)
          : Number(diceResult) - Number(mod);
    else finalResult = diceResult;

    finalMessage =
      signal && mod
        ? `rolou um #d${dice} ${signal} ${mod} e tirou <b>${finalResult}</b>`
        : `rolou um #d${dice} e tirou <b>${finalResult}</b>`;

    if (diceResult === 1 || diceResult === 20) {
      finalMessage =
        signal && mod
          ? finalMessage + ` (natural ${diceResult} ${signal} ${mod})`
          : finalMessage + ` (natural ${diceResult})`;
    } else {
      finalMessage =
        signal && mod
          ? finalMessage + ` (${diceResult} ${signal} ${mod})`
          : finalMessage;
    }
  } else if (newMessage.startsWith("/char")) {
    isChangingChar = true;
    char = newMessage.split(" ")[1].split(" ")[0];
    finalMessage = `atualizou char para <b>${char}</b>`;
  } else if (newMessage.startsWith("/color")) {
    isColor = true;
    color = newMessage.split(" ")[1].split(" ")[0];
    finalMessage = `atualizou cor para ${color}`;
  } else if (newMessage.startsWith("/-") || newMessage.startsWith("---")) {
    isPassingLine = true;
    finalMessage = `<hr>`;
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
