import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';

import TableHeader from './TableHeader';
import TableContent from './TableContent';

export default function WholeTable(props) {
    return (
        <TableContainer
            component={Paper}
            sx={{ maxHeight: 800, maxWidth: 650 }}
        >
            <Table
                size='small'
                aria-label='simple table'
                className={props.type}
            >
                <TableHeader width={props.width} type={props.type} />
                <TableContent
                    arr={props.arr}
                    amountToShow={props.maxRows}
                    type={props.type}
                    width={props.width}
                    qtyDecimals={props.qtyDecimals}
                />
            </Table>
        </TableContainer>
    );
}
