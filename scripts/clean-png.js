const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'public', 'assets');

function isCorruptedPngHeader(buf){
  // Expected PNG signature: 89 50 4E 47 0D 0A 1A 0A
  // Observed corruption: EF BF BD 50 4E 47 0D 0A ...
  return (
    buf.length >= 8 &&
    buf[0] === 0xEF && buf[1] === 0xBF && buf[2] === 0xBD &&
    buf[3] === 0x50 && buf[4] === 0x4E && buf[5] === 0x47 && buf[6] === 0x0D && buf[7] === 0x0A
  );
}

function isMissingFirstByte(buf){
  // Starts with 'PNG\r\n\x1A\n' but missing leading 0x89
  return (
    buf.length >= 8 &&
    buf[0] === 0x50 && buf[1] === 0x4E && buf[2] === 0x47 && buf[3] === 0x0D && buf[4] === 0x0A && buf[5] === 0x1A && buf[6] === 0x0A
  );
}

function fixFile(filePath){
  const buf = fs.readFileSync(filePath);
  if(!(isCorruptedPngHeader(buf) || isMissingFirstByte(buf))){
    console.log(`OK  ${path.basename(filePath)} (header looks fine)`);
    return false;
  }
  const body = isCorruptedPngHeader(buf) ? buf.slice(3) : buf;
  // Ensure PNG starts with 0x89 before 'PNG\r\n\x1A\n'
  const fixed = Buffer.concat([Buffer.from([0x89]), body]);
  fs.writeFileSync(filePath, fixed);
  console.log(`FIX ${path.basename(filePath)} (removed EF BF BD, added 0x89)`);
  return true;
}

function run(){
  const entries = fs.readdirSync(assetsDir);
  let fixedCount = 0;
  for(const name of entries){
    if(!name.toLowerCase().endsWith('.png')) continue;
    const fp = path.join(assetsDir, name);
    try{
      fixedCount += fixFile(fp) ? 1 : 0;
    }catch(err){
      console.error(`ERR ${name}:`, err.message);
    }
  }
  console.log(`Done. Fixed ${fixedCount} file(s).`);
}

run();

