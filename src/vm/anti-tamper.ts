export function generateAntiTamper(): string {
  return String.raw`do
  local __AT_FAIL = function(reason)
    error("Clyde VM integrity check failed" .. (reason and (": " .. reason) or ""), 0)
  end
  local __AT_ENV = (getfenv and getfenv()) or _G
  local __AT_HASHES = {[1642754488]=25,[3105969070]=50,[48342080]=50,[793184576]=25}
  local __AT_SUM, __AT_ITER, __AT_IDX = 0, 0, nil
  if type(__AT_ENV) ~= "table" then __AT_FAIL("environment") end
  while true do
    local __AT_VALUE
    __AT_IDX, __AT_VALUE = next(__AT_ENV, __AT_IDX)
    if __AT_IDX == nil then break end
    if type(__AT_IDX) == "string" and #__AT_IDX < 20 then
      local __AT_HASH = 2166136261
      local __AT_BYTES = {string.byte(__AT_IDX,1,-1)}
      local __AT_I = nil
      while true do
        local __AT_B
        __AT_I, __AT_B = next(__AT_BYTES,__AT_I)
        if __AT_I == nil then break end
        local __AT_X = bit32.bxor(__AT_HASH,__AT_B)
        if __AT_X >= 134217728 then
          local __AT_A = __AT_X % 65536
          local __AT_B2 = (__AT_X-__AT_A)/65536
          local __AT_C = __AT_A*403
          __AT_HASH = ((__AT_B2*403+__AT_A*256)%65536)*65536+__AT_C
        else
          __AT_HASH = __AT_X*16777619%4294967296
        end
      end
      __AT_SUM = __AT_SUM + (__AT_HASHES[__AT_HASH] or 0)
      __AT_ITER = __AT_ITER + 1
    end
  end
  local function __AT_TRAP_CHECK()
    local function __AT_RET(...) return ... end
    local __AT_MT={__tostring=__AT_FAIL,__call=__AT_RET,__add=__AT_RET,__sub=__AT_RET,__mul=__AT_RET,__div=__AT_RET,__mod=__AT_RET,__pow=__AT_RET,__eq=__AT_RET,__lt=__AT_RET,__le=__AT_RET,__concat=__AT_RET,__index=__AT_RET,__newindex=__AT_RET,__metatable=false}
    local __AT_T=setmetatable({},__AT_MT)
    if __AT_T(__AT_T) ~= __AT_T then __AT_FAIL("metamethod") end
    if (__AT_T + __AT_T) ~= __AT_T then __AT_FAIL("metamethod") end
    if (__AT_T .. "") ~= __AT_T then __AT_FAIL("metamethod") end
    __AT_MT.__tostring=nil
  end
  __AT_TRAP_CHECK()
  if rawget(_G,"Stack") ~= nil then
    if type(Stack) ~= "table" then __AT_FAIL("stack type") end
    if getmetatable(Stack) ~= nil then __AT_FAIL("stack metatable") end
  end
  if debug and debug.getinfo then
    local __AT_OK,__AT_INFO=pcall(debug.getinfo,1,"S")
    if not __AT_OK or type(__AT_INFO) ~= "table" then __AT_FAIL("debug integrity") end
  end
end`;
}
