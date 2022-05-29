import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';

import TableHeader from './TableHeader';
import TableContent from './TableContent';

export default function WholeTable(props) {
    return (
        <TableContainer component={Paper} className='table--container'>
            <Table
                size='small'
                aria-label='simple table'
                className={'table_' + props.type}
            >
                <TableHeader type={props.type} />
                <TableContent
                    arr={props.arr}
                    amountToShow={props.maxRows}
                    type={props.type}
                    qtyDecimals={props.qtyDecimals}
                />
            </Table>
        </TableContainer>
    );
}
