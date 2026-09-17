const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Fix line 1816 where b.facilitators was seeded with ['d1']
const oldSeedBatchFac = "    if (!b.facilitators || !b.facilitators.length) b.facilitators = ['d1'];";
const newSeedBatchFac = "    if (!b.facilitators) b.facilitators = [];";
if (!html.includes(oldSeedBatchFac)) {
  console.error('Could not find oldSeedBatchFac');
  process.exit(1);
}
html = html.replace(oldSeedBatchFac, newSeedBatchFac);
console.log('1. Replaced seed batch facilitators default');

// 2. Fix getBatchFacilitators(batchId)
const oldGetBatchFacStart = "function getBatchFacilitators(batchId){";
const oldGetBatchFacEnd = "function getBatchVolunteers(batchId){";

const gbfStart = html.indexOf(oldGetBatchFacStart);
const gbfEnd = html.indexOf(oldGetBatchFacEnd, gbfStart);

if (gbfStart === -1 || gbfEnd === -1) {
  console.error('Could not locate getBatchFacilitators bounds');
  process.exit(1);
}

const newGetBatchFac = `function getBatchFacilitators(batchId){
  const b = batch(batchId);
  if(!b) return [];
  // Only those who have been explicitly allotted as the facilitators of the batch
  const rawList = Array.isArray(b.facilitators) ? b.facilitators : [];
  return rawList
    .map(id => {
      if(typeof id === 'object' && id !== null) return (dv(id.id || id._id || id.customId) || id);
      return dv(id) || (DB.devotees||[]).find(x => x.id === id || x._id === id || x.customId === id || x.name === id);
    })
    .filter(Boolean);
}

`;

html = html.slice(0, gbfStart) + newGetBatchFac + html.slice(gbfEnd);
console.log('2. Updated getBatchFacilitators implementation');

// 3. Update loadBatchesFromStorage to strip any stale 'd1' from batch facilitators
const oldLoadBatches = `        const b = (DB.batches||[]).find(x => x.id === saved.id);
        if(b){
          Object.assign(b, saved);
        } else {
          DB.batches.push(saved);
        }
      });
    }
  }catch(e){console.warn('loadBatchesFromStorage error:', e)}`;

const newLoadBatches = `        const b = (DB.batches||[]).find(x => x.id === saved.id);
        if(b){
          Object.assign(b, saved);
        } else {
          DB.batches.push(saved);
        }
      });
    }
    // Clean up any stale 'd1' that was mistakenly seeded into batch facilitators
    (DB.batches||[]).forEach(b => {
      if(Array.isArray(b.facilitators)){
        b.facilitators = b.facilitators.filter(f => f !== 'd1');
      }
    });
  }catch(e){console.warn('loadBatchesFromStorage error:', e)}`;

if (html.includes(oldLoadBatches)) {
  html = html.replace(oldLoadBatches, newLoadBatches);
  console.log('3. Updated loadBatchesFromStorage');
} else {
  // Try CRLF agnostic
  const targetSnippet = "if(Array.isArray(list)){";
  const targetIdx = html.indexOf(targetSnippet, html.indexOf("function loadBatchesFromStorage(){"));
  const endIdx = html.indexOf("}catch(e){console.warn('loadBatchesFromStorage error:', e)}", targetIdx);
  if (targetIdx !== -1 && endIdx !== -1) {
    const replacement = `if(Array.isArray(list)){
      list.forEach(saved => {
        const b = (DB.batches||[]).find(x => x.id === saved.id);
        if(b){
          Object.assign(b, saved);
        } else {
          DB.batches.push(saved);
        }
      });
    }
    (DB.batches||[]).forEach(b => {
      if(Array.isArray(b.facilitators)){
        b.facilitators = b.facilitators.filter(f => f !== 'd1');
      }
    });
  `;
    html = html.slice(0, targetIdx) + replacement + html.slice(endIdx);
    console.log('3. Updated loadBatchesFromStorage (regex/slice)');
  }
}

// 4. In syncDevoteesFromServer, ensure Taksharya has its 7 allotted facilitators if not explicitly configured
const syncMarker = "if(changed) render();";
const syncIdx = html.indexOf(syncMarker, html.indexOf("async function syncDevoteesFromServer"));
if (syncIdx === -1) {
  console.error('Could not find syncMarker');
  process.exit(1);
}

const taksharyaInitCode = `      // Ensure Taksharya has its allotted facilitators if not explicitly configured
      const takBatch = (DB.batches||[]).find(x => x.id === 'b1' || x.name === 'Taksharya');
      if (takBatch && (!takBatch.facilitators || !takBatch.facilitators.length || (takBatch.facilitators.length === 1 && takBatch.facilitators[0] === 'd1'))) {
        const allottedNames = ['Bharat', 'Suresh', 'Aman Raj', 'Suraj', 'Harsh', 'Dhirendra', 'Swayam Bhagavan'];
        const matchedIds = [];
        allottedNames.forEach(n => {
          const d = (DB.devotees||[]).find(x => x.name && new RegExp('\\\\b' + n + '\\\\b', 'i').test(x.name) && x.name !== 'Harsh chaubey');
          if (d && !matchedIds.includes(d.id)) matchedIds.push(d.id);
        });
        if (matchedIds.length >= 5) {
          takBatch.facilitators = matchedIds;
          saveBatchesToStorage();
          changed = true;
        }
      }

      `;

html = html.slice(0, syncIdx) + taksharyaInitCode + html.slice(syncIdx);
console.log('4. Added Taksharya allotted facilitators initialization in syncDevoteesFromServer');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Successfully written public/index.html');
