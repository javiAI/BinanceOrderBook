export default function updateTable(updates, arr, type, price, u) {
    /*
    Checks if "price" of update is already included in Order Book (OB) and "quantity" is positive.
        - If "price" already in OB and "quantity" is positive, updates "quantity" and "UpdateId" on OB's row. 
        - If "price" already in OB but "quantity" is 0, removes row from OB.
        - If "price" not in OB but "quantity" is positive, pushes update to OB.
     */
    const _updateRows = (arr, updates) => {
        for (let n = 0; n < updates.length; n++) {
            const [p, q] = updates[n]; // [p, q] => [price, quantity]
            // const u = updates.u;
            const index = arr.findIndex((e) => e.price === p);

            index + 1 // Falsy if "index = -1"
                ? q > 0
                    ? (arr[index] = { ...arr[index], quantity: q, maxId: u })
                    : arr.splice(index, 1)
                : q > 0 && arr.push({ price: p, quantity: q, maxId: u });
        }
        return arr;
    };

    // Filters out asks/bids lower/higher than current price if their update is older than price update ()
    const _filterRows = (arr, price, selector, updateId) => {
        return arr.filter(
            (item) =>
                (selector ? item.price >= price : item.price <= price) |
                (item.lastUpdateId > u)
        );
    };

    // Compare function, higher-to-lower.
    const _higherToLower = (a, b) => {
        if (parseFloat(a.price) < parseFloat(b.price)) return 1;
        if (parseFloat(a.price) > parseFloat(b.price)) return -1;
        return 0;
    };

    // Compare function, lower-to-higher.
    const _lowerToHigher = (a, b) => {
        if (parseFloat(a.price) > parseFloat(b.price)) return 1;
        if (parseFloat(a.price) < parseFloat(b.price)) return -1;
        return 0;
    };

    // Sort lower-to-higher if "asks", higher-to-lower if "bids"
    const _sortRows = (arr, selector) =>
        arr.sort(selector ? _lowerToHigher : _higherToLower);

    const selector = type === 'asks' ? true : false;

    arr = _updateRows(arr, updates);
    arr = _filterRows(arr, price, selector, u);
    arr = _sortRows(arr, selector);

    return arr;
}
