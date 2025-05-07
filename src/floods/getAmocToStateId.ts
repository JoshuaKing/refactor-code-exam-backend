export function getAmocToStateId(state: string): string {
  switch (state) { // Replace with StateIds[state] || 'unk' - or better just undefined/error if invalid
    case "NT":
      return "IDD";
    case "NSW":
      return "IDN";
    case "Qld":
      return "IDQ";
    case "SA":
      return "IDS";
    case "Tas":
      return "IDT";
    case "Vic":
      return "IDV";
    case "WA":
      return "IDW";
    case "ACT":
      return "IDN";
  }

  return "unk";
}
