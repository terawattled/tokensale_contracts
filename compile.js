const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'master_contract', 'build');

const masterPath = path.resolve(__dirname, 'master_contract', 'Master.sol');
const source = fs.readFileSync(masterPath, 'utf-8');
const output = solc.compile(source, 1).contracts;

for (let contract in output) {
	fs.outputJsonSync(
		path.resolve(buildPath, contract.replace(':','') + '.json'),
		output[contract]
	);
}