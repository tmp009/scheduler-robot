require('dotenv').config();

const fs = require('fs/promises');
const RobotClient = require('./lib/client');

const yargs = require('yargs');

// Define the command-line options
const argv = yargs
    .options({
        'host': {
            alias: 'H',
            describe: 'the target machine running the control server.',
            type: 'string',
            default: "0.0.0.0",
        },
        'port': {
            alias: 'p',
            describe: 'the port the server is listening to.',
            type: 'number',
            default: 3000,
            demandOption: true
        }
})
.showHelpOnFail(true, 'Error: Missing positional argument. Please provide a positional argument')
.demandCommand(1)
.usage('Usage: $0 [options] <script>')
.alias('h', 'help')
.check((argv) => {
    if (isNaN(argv.port)) {
        throw new Error('Error: Invalid value for "port". Please provide a valid number.');
    }
    return true;
})
.argv;

const args = argv._;

const hostname = argv.host;
const port = argv.port;
const client = new RobotClient(hostname,port);



async function main() {
    const inputFile =  args[0];
    const data = await fs.readFile(inputFile, {encoding: 'utf-8'});
    let jsonData;

    try {
        jsonData = JSON.parse(data);
    } catch (error) {
        console.error('Failed to parse JSON data!');
        console.error(error.message);

        return
    }

    await client.keyTap(['ctrl', 'a'])
    await client.keyTap('up')

    for (const category of jsonData.categories) {
        if (!category.accounts || !category.id) {
            await client.keyTap('down') // go to next account
            continue
        }

        console.info('[info]: entering category id', category.id, 'with description', category.description)

        await client.keyTap(['ctrl', 'down']) // enter category

        for (const account of category.accounts) {
            if (!account.id) {
                await client.keyTap('down') // skip empty account
                continue;
            }
            await client.keyTap(['ctrl', 'down']) // enter account

            console.info('[info]: entering account', account.id);

            try {
                for (const data of account.values) {
                    if (data[0] == 'Total Fringes') { // can't edit this field. so we'll skip it
                        continue;
                    }

                    console.info('[info]: ', data);

                    for (const value of data) {
                        if (!value) {
                            await client.keyTap('tab');
                        } else {
                            await client.writeTextTab(value);
                        }
                    }
                }

            } finally {
                await client.keyTap(['ctrl', 'd']);
            }

            console.info('[info]: exiting account')
            await client.keyTap(['ctrl', 'up']) // exit account
            await client.keyTap('down') // go to next account
            await new Promise(r => setTimeout(r, 500));
        }

        await client.keyTap(['ctrl', 'up']) // exit category
        await client.sendMultipleKeys(['tab', 'tab']) // go to next account
        await new Promise(r => setTimeout(r, 500));

    }

}

main();