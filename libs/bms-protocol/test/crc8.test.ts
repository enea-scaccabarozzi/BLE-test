import { calculateCrc8, generateCrc8Table } from "../crc8";

describe("[ bms-protocol ]", () => {
  describe("[ crc8 ]", () => {
    describe("generateCrc8Table", () => {
      it("should generate a table with 256 entries", () => {
        const table = generateCrc8Table();
        expect(table).toHaveLength(256);
      });

      it("should contain values in the range of 0 to 255", () => {
        const table = generateCrc8Table();
        for (const value of table) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(255);
        }
      });

      it("should be deterministic (same table every time)", () => {
        const table1 = generateCrc8Table();
        const table2 = generateCrc8Table();
        expect(table1).toEqual(table2);
      });
    });

    describe("calculateCrc8", () => {
      it("should calculate a CRC-8 value for given data", () => {
        const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        const crc = calculateCrc8(data);
        expect(typeof crc).toBe("number");
        expect(crc).toBeGreaterThanOrEqual(0);
        expect(crc).toBeLessThanOrEqual(255);
      });

      it("should return 0 for an empty data array", () => {
        const data = new Uint8Array([]);
        const crc = calculateCrc8(data);
        expect(crc).toBe(0);
      });

      it("should calculate the same CRC-8 value for the same input", () => {
        const data = new Uint8Array([0x10, 0x20, 0x30, 0x40]);
        const crc1 = calculateCrc8(data);
        const crc2 = calculateCrc8(data);
        expect(crc1).toBe(crc2);
      });

      it("should calculate different CRC-8 values for different inputs", () => {
        const data1 = new Uint8Array([0x10, 0x20, 0x30, 0x40]);
        const data2 = new Uint8Array([0x10, 0x20, 0x30, 0x41]);
        const crc1 = calculateCrc8(data1);
        const crc2 = calculateCrc8(data2);
        expect(crc1).not.toBe(crc2);
      });
    });
  });
});
