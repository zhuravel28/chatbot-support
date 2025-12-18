import { makeCacheKey } from "../utils.js";

test("makeCacheKey формує ключ кешу", () => {
  expect(makeCacheKey(5, " Привіт ")).toBe("5|привіт");
});
