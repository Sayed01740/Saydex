const fs = require('fs');
const path = require('path');

const deployed = require('../deployed-addresses.json');
const details = require('../verification-details.json');

const CONTRACTS_MAP = {
  NonfungibleTokenPositionDescriptor: {
    referenceAddress: '0x91ae842A5Ffd8d12023116943e72A606179294f3',
    giwaAddress: deployed.contracts.NonfungibleTokenPositionDescriptor,
    fixLibraries: (settings) => {
      settings.libraries = {
        'contracts/libraries/NFTDescriptor.sol:NFTDescriptor': deployed.contracts.NFTDescriptor
      };
    }
  },
  QuoterV2: {
    referenceAddress: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    giwaAddress: deployed.contracts.QuoterV2,
  },
};

function getConstructorArgs(name) {
  const item = details.find(x => x.name === name);
  return item ? (item.constructorArguments || '') : '';
}

async function verifyOne(name, config) {
  console.log(`\n⏳ Verifying ${name} (${config.giwaAddress})...`);

  // Check if already verified
  try {
    const statusRes = await fetch(`https://sepolia-explorer.giwa.io/api/v2/smart-contracts/${config.giwaAddress.toLowerCase()}`);
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      if (statusData && statusData.is_verified) {
        console.log(`   ✅ Already verified!`);
        return true;
      }
    }
  } catch (e) {}

  const refRes = await fetch(`https://eth.blockscout.com/api/v2/smart-contracts/${config.referenceAddress}`);
  const refData = await refRes.json();
  if (!refData.source_code) {
    console.error(`   ❌ Failed to fetch reference code for ${name}`);
    return false;
  }

  const sources = {};
  sources[refData.file_path] = { content: refData.source_code };
  for (const s of (refData.additional_sources || [])) {
    sources[s.file_path] = { content: s.source_code };
  }

  const settings = JSON.parse(JSON.stringify(refData.compiler_settings));
  if (config.fixLibraries) {
    config.fixLibraries(settings);
  }

  const standardJson = {
    language: 'Solidity',
    sources: sources,
    settings: settings
  };

  const constructorArgs = getConstructorArgs(name);

  const bodyParams = {
    contractaddress: config.giwaAddress,
    compilerversion: 'v' + refData.compiler_version,
    contractname: refData.file_path + ':' + refData.name,
    sourceCode: JSON.stringify(standardJson),
    codeformat: 'solidity-standard-json-input'
  };

  if (constructorArgs) {
    bodyParams.constructorArguements = constructorArgs;
  }

  const postRes = await fetch('https://sepolia-explorer.giwa.io/api?module=contract&action=verifysourcecode', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(bodyParams)
  });

  const postText = await postRes.text();
  console.log(`   📡 GIWA Explorer HTTP Status: ${postRes.status}, Body: ${postText.slice(0, 150)}`);
  let postData;
  try {
    postData = JSON.parse(postText);
  } catch (e) {
    console.error(`   ❌ GIWA Explorer returned non-JSON: ${postText.slice(0, 200)}`);
    return false;
  }

  if (postData.status === '1') {
    const guid = postData.result;
    console.log(`   🔎 Checking status for GUID: ${guid}...`);
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 4000));
      try {
        const checkRes = await fetch(`https://sepolia-explorer.giwa.io/api?module=contract&action=checkverifystatus&guid=${guid}`);
        const checkData = await checkRes.json();
        console.log(`      Status check (${i + 1}/6):`, checkData.result);
        if (checkData.result && checkData.result.includes('Pass')) {
          console.log(`   🎉 ${name} verified successfully!`);
          return true;
        }
        if (checkData.result && checkData.result.includes('Fail')) {
          console.log(`   ⚠️ Verification message:`, checkData.result);
          break;
        }
      } catch (e) {}
    }
  } else {
    console.log(`   ⚠️ Note: ${postData.message || JSON.stringify(postData)}`);
  }

  return false;
}

async function main() {
  for (const [name, config] of Object.entries(CONTRACTS_MAP)) {
    try {
      await verifyOne(name, config);
    } catch (err) {
      console.error(`   ❌ Error verifying ${name}:`, err.stack);
    }
  }
}

main();
