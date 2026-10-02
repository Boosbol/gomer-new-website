import { describe, expect, it } from "vitest";
import { cleanEnvValue, describeUrlStart, isMysqlUrl, lowerEnvValue } from "./env-clean";

describe("env-clean", () => {
  it("membuang spasi dan tanda kutip pembungkus; kosong → undefined", () => {
    expect(cleanEnvValue('  "mysql://a"  ')).toBe("mysql://a");
    expect(cleanEnvValue("'false'")).toBe("false");
    expect(cleanEnvValue("   ")).toBeUndefined();
    expect(cleanEnvValue('""')).toBeUndefined();
    expect(cleanEnvValue(undefined)).toBeUndefined();
  });
  it("huruf besar/kecil tidak mempengaruhi nilai boolean", () => {
    expect(lowerEnvValue(" False ")).toBe("false");
    expect(lowerEnvValue('"TRUE"')).toBe("true");
  });
  it("mengenali URL MySQL", () => {
    expect(isMysqlUrl("mysql://u:p@127.0.0.1:3306/db")).toBe(true);
    expect(isMysqlUrl("jdbc:mysql://127.0.0.1/db")).toBe(false);
    expect(isMysqlUrl("postgres://x")).toBe(false);
  });
  it("menjelaskan awalan tanpa membocorkan isi", () => {
    expect(describeUrlStart(undefined)).toBe("kosong");
    expect(describeUrlStart('"mysql://u:rahasia@h/db"')).toBe("diawali tanda kutip");
    expect(describeUrlStart("jdbc:mysql://u:rahasia@h/db")).toBe('diawali "jdbc:mysql://"');
    expect(describeUrlStart("u123_user:rahasia@127.0.0.1")).toBe("tidak berbentuk alamat (tidak ada ://)");
    expect(describeUrlStart("mysql://u:rahasia@h/db")).not.toContain("rahasia");
  });
});
