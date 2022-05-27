export default function getDecimals(value) {
    /* 
    Receives a number and returns:
        - if the number is an integer, its number of significant digits multiplied by -1.
        - if the number is a float, the number of significant decimals.
    
    Used to obtain maximum/minimum amount of decimals for a given pair
    */

    const _toPlainString = (num) => {
        /*
            Converts any format number, including scientific notation, to plain string. 1e-7 -> "0.0000001"
            Source: https://stackoverflow.com/questions/1685680/how-to-avoid-scientific-notation-for-large-numbers-in-javascript/61281355#61281355 
            */
        return ('' + +num).replace(
            /(-?)(\d*)\.?(\d*)e([+-]\d+)/,
            function (a, b, c, d, e) {
                return e < 0
                    ? b + '0.' + Array(1 - e - c.length).join(0) + c + d
                    : b + c + d + Array(e - d.length + 1).join(0);
            }
        );
    };

    return Number(value) % 1 === 0
        ? _toPlainString(value).length * -1
        : _toPlainString(value).split('.')[1].length;
}
