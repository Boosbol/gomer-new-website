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

import { describeDatabaseUrl } from "./env-clean";

describe("describeDatabaseUrl", () => {
  it("menguraikan bagian-bagian tanpa membocorkan password", () => {
    const info = describeDatabaseUrl("mysql://u123456789_user:Rahasia-Panjang_123@127.0.0.1:3306/u123456789_db");
    expect(info).toMatchObject({ user: "u123456789_user", host: "127.0.0.1", port: "3306", database: "u123456789_db", passwordLength: 19 });
    expect(info?.warnings).toEqual([]);
    expect(JSON.stringify(info)).not.toContain("Rahasia");
  });
  it("memperingatkan kesalahan umum", () => {
    const warn = (u: string) => describeDatabaseUrl(u)?.warnings.join(" | ") ?? "";
    expect(warn("mysql://u1_a:password-oke-123@localhost:3306/u1_db")).toContain("127.0.0.1");
    expect(warn("mysql://admin:password-oke-123@127.0.0.1:3306/gomer")).toContain("awalan");
    expect(warn("mysql://u1_a:password-oke-123@127.0.0.1:3306/u2_db")).toContain("berbeda");
    expect(warn("mysql://u1_a:pendek@127.0.0.1:3306/u1_db")).toContain("terpotong");
    expect(warn("mysql:// u1_a:password-oke-123@127.0.0.1:3306/u1_db")).toContain("spasi");
    expect(warn("mysql://u1_a:password-oke-123@127.0.0.1:3306/")).toContain("Nama database");
  });
  it("mengembalikan null untuk nilai yang tidak bisa dibaca", () => {
    expect(describeDatabaseUrl(undefined)).toBeNull();
    expect(describeDatabaseUrl("bukan url")).toBeNull();
  });
});
