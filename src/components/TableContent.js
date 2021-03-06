import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

export default function TableContent(props) {
    let cum = 0;
    const rows = props.amountToShow;
    const qtyDecimals = props.qtyDecimals;
    const selector = props.type === 'asks' ? true : false;

    const totalSize = props.arr.reduce((a, c) => a + Number(c.quantity), 0);

    const arr = props.arr.slice(0, rows).map((row, index) => {
        cum += +row.quantity;

        const ratio = ((cum / totalSize) * 100).toFixed(2);
        const leftRatio = (selector ? 100 - ratio : ratio).toString();

        const color1 = selector ? '#ffe6e6' : '#8fbc8f';
        const color2 = selector ? '#cd5c5c' : '#efffef';

        const rowBackground = `linear-gradient(90deg, ${color1} ${leftRatio}%, ${color2} ${leftRatio}%)`;

        return (
            <TableRow
                key={props.type + '_' + index}
                style={{ background: rowBackground }}
            >
                <TableCell className='content-cell'>
                    {selector ? `${ratio} %` : row.price}
                </TableCell>
                <TableCell className='content-cell'>
                    {selector ? cum.toFixed(qtyDecimals) : row.quantity}
                </TableCell>
                <TableCell className='content-cell'>
                    {selector ? row.quantity : cum.toFixed(qtyDecimals)}
                </TableCell>
                <TableCell className='content-cell'>
                    {selector ? row.price : `${ratio} %`}
                </TableCell>
            </TableRow>
        );
    });
    return <TableBody>{arr}</TableBody>;
}
