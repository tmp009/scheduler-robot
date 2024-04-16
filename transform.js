const fs = require('fs');

fs.readFile('input.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    try {
        const inputData = JSON.parse(data);

        const transformedData = transformData(inputData);

        fs.writeFile('output.json', JSON.stringify(transformedData, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return;
            }
            console.log('Transformation successful. Check output.json');
        });
    } catch (err) {
        console.error('Error parsing JSON:', err);
    }
});

function transformData(inputData) {
    const transformedCategories = inputData.categories.map(category => {
        const transformedAccounts = inputData.accounts
            .filter(account => account.categoryID === category.cID)
            .map(account => {
                const values = inputData.details
                    .filter(detail => detail.accountID === account.aID)
                    .map(detail => [
                        detail.dDescription || null,
                        detail.dAmount === 0 ? "0" : (detail.dAmount || null),
                        detail.dUnit || null,
                        detail.dX || null,
                        detail.dCurrency || null,
                        detail.dRate === 0 ? "0" : (detail.dRate || null)
                    ]);
                return {
                    id: account.aNumber || null,
                    description: account.aDescription,
                    values: values
                };
            });

        const accountsWithoutId = inputData.accounts.filter(account => !account.aNumber && account.categoryID === category.cID);
        accountsWithoutId.forEach(account => {
            transformedAccounts.push({
                id: null,
                description: account.aDescription,
                values: []
            });
        });

        return {
            id: String(category.cNumber),
            description: category.cDescription,
            accounts: transformedAccounts
        };
    });

    return {
        categories: transformedCategories
    };
}
