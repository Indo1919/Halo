"""Minimal brotli shim for fontTools, backed by Node's built-in zlib brotli."""
import subprocess

_JS_D = "const z=require('zlib');const c=[];process.stdin.on('data',d=>c.push(d));process.stdin.on('end',()=>process.stdout.write(z.brotliDecompressSync(Buffer.concat(c))));"
_JS_C = "const z=require('zlib');const c=[];process.stdin.on('data',d=>c.push(d));process.stdin.on('end',()=>process.stdout.write(z.brotliCompressSync(Buffer.concat(c),{params:{[z.constants.BROTLI_PARAM_QUALITY]:11,[z.constants.BROTLI_PARAM_MODE]:z.constants.BROTLI_MODE_FONT}})));"

def decompress(data):
    return subprocess.run(["node", "-e", _JS_D], input=bytes(data), capture_output=True, check=True).stdout

def compress(data, mode=0, quality=11, lgwin=22, lgblock=0):
    return subprocess.run(["node", "-e", _JS_C], input=bytes(data), capture_output=True, check=True).stdout

MODE_GENERIC, MODE_TEXT, MODE_FONT = 0, 1, 2
error = Exception
