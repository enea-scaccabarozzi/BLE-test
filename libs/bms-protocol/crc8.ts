const generateCrc8Table = (): number[] => {
  const table: number[] = new Array(256);
  const polynomial = 0x07;
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x80) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
    }
    table[i] = crc & 0xff;
  }
  return table;
};

const crc8Table = generateCrc8Table();

export const calculateCrc8 = (data: Uint8Array): number => {
  let crc = 0x00;
  for (const byte of data) {
    crc = crc8Table[(crc ^ byte) & 0xff];
  }
  return crc;
};
