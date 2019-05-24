import React from 'react';
import { withStyles } from '@material-ui/styles';
import Grid from '@material-ui/core/Grid';
import flow from 'lodash/flow';
import PropTypes from 'prop-types';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import TablePagination from '@material-ui/core/TablePagination';
import Paper from '@material-ui/core/Paper';

// component
import Loader from '../loader';
import TableToolbar from './table-toolbar';
import TableHeader from './table-header';
import TableRowData from './table-row';

const useStyles = () => ({
    wrapper: {
        width: '100%',
        padding: '10vh 0 0 0',
    },
    root: {
        width: '100%',
        marginTop: 10,
    },
    table: {
        minWidth: 1020,
    },
    tableWrapper: {
        overflowX: 'auto',
    },
});
class UserTable extends React.Component {
    state = {
        order: 'asc',
        orderBy: 'username',
        selected: [],
        page: 0,
        rowsPerPage: 10,
    };

    desc = (a, b) => {
        if (b[this.state.orderBy] < a[this.state.orderBy]) {
            return this.state.order === 'desc' ? -1 : 1;
        }
        if (b[this.state.orderBy] > a[this.state.orderBy]) {
            return this.state.order === 'desc' ? 1 : -1;
        }
        return 0;
    };

    stableSort = (array) => {
        const stabilizedThis = array.map((el, index) => [el, index]);

        stabilizedThis.sort((a, b) => {
            const order = this.desc(a[0], b[0]);
            if (order !== 0) return order;
            return a[1] - b[1];
        });
        return stabilizedThis.map(el => el[0]);
    };

    handleRequestSort = (property) => {
        const orderBy = property;
        let order = 'desc';

        if (this.state.orderBy === property && this.state.order === 'desc') {
            order = 'asc';
        }
        this.setState({ order, orderBy });
    };

    handleSelectAllClick = (isChecked) => {
        if (isChecked) {
            this.setState({ selected: this.props.data.map(n => n._id) });
            return;
        }
        this.setState({ selected: [] });
    };

    handleClick = (id) => {
        const { selected } = this.state;
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        this.setState({ selected: newSelected });
    };

    handleChangePage = (event, page) => {
        this.setState({ page });
    };

    handleChangeRowsPerPage = (event) => {
        this.setState({ rowsPerPage: event.target.value });
    };

    isSelected = id => this.state.selected.indexOf(id) !== -1;

    render() {
        const { classes } = this.props;
        let emptyRows;
        const {
            order, orderBy, selected, rowsPerPage, page,
        } = this.state;
        const {
            data,
        } = this.props;
        if (data) {
            emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);
            return (
                <div className={classes.wrapper}>
                    <Grid container >
                        <Grid item xs={12}>
                            <Paper className={classes.root}>
                                <TableToolbar type={this.props.type} numSelected={selected.length} setFilter={this.handleRequestSort} filter={this.state.orderBy}/>
                                <div className={classes.tableWrapper}>
                                    <Table className={classes.table} aria-labelledby="tableTitle">
                                        <TableHeader
                                            numSelected={selected.length}
                                            order={order}
                                            orderBy={orderBy}
                                            onSelectAllClick={this.handleSelectAllClick}
                                            onRequestSort={this.handleRequestSort}
                                            rowCount={data.length}
                                            type={this.props.type}
                                        />
                                        <TableBody>
                                            {this.stableSort(data)
                                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                .map(n => (<TableRowData
                                                    key={`rowData-${n._id}`}
                                                    data={n}
                                                    type={this.props.type}
                                                    isSelected={this.isSelected(n._id)}
                                                    handleClick={this.handleClick.bind(this, n._id)}
                                                    editHandler={this.props.editHandler.bind(this, n._id)}
                                                />
                                                ))}
                                            {emptyRows > 0 && (
                                                <TableRow style={{ height: 49 * emptyRows }}>
                                                    <TableCell colSpan={6} />
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    component="div"
                                    count={data.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    backIconButtonProps={{
                                        'aria-label': 'Previous Page',
                                    }}
                                    nextIconButtonProps={{
                                        'aria-label': 'Next Page',
                                    }}
                                    onChangePage={this.handleChangePage}
                                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                </div>
            );
        }

        return (
            <Loader/>
        );
    }
}

UserTable.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default flow(
    withStyles(useStyles),
)(UserTable);
