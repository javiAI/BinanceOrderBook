import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

export default function TableHeader(props) {
    const selector = props.type === 'asks' ? true : false;
    return (
        <TableHead className='table--header'>
            <TableRow>
                <TableCell align='center'>
                    <p>{selector ? `Sum / Total (%)` : 'Price'}</p>
                </TableCell>
                <TableCell align='center'>
                    <p>{selector ? 'Sum' : 'Size'}</p>
                </TableCell>
                <TableCell align='center'>
                    <p>{selector ? 'Size' : 'Sum'}</p>
                </TableCell>
                <TableCell align='center'>
                    <p>{selector ? 'Price' : `Sum / Total (%)`}</p>
                </TableCell>
            </TableRow>
        </TableHead>
    );
}
