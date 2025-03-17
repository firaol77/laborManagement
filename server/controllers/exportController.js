const ExcelJS = require('exceljs');
const { LaborWorker, WorkLog, PayrollRule } = require('../models');
const { Op } = require('sequelize');

exports.exportPayroll = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payroll Report');

        // Set up headers
        worksheet.columns = [
            { header: 'Worker ID', key: 'worker_id', width: 15 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Regular Hours', key: 'regular_hours', width: 15 },
            { header: 'Overtime Hours', key: 'overtime_hours', width: 15 },
            { header: 'Daily Rate', key: 'daily_rate', width: 15 },
            { header: 'Overtime Rate', key: 'overtime_rate', width: 15 },
            { header: 'Regular Pay', key: 'regular_pay', width: 15 },
            { header: 'Overtime Pay', key: 'overtime_pay', width: 15 },
            { header: 'Total Pay', key: 'total_pay', width: 15 }
        ];

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };

        // Get company payroll rules
        const payrollRules = await PayrollRule.findOne({
            where: { company_id: req.user.company_id }
        });

        // Get all workers and their work logs
        const workers = await LaborWorker.findAll({
            where: { company_id: req.user.company_id },
            include: [{
                model: WorkLog,
                where: start_date && end_date ? {
                    date: { [Op.between]: [start_date, end_date] }
                } : {},
                required: false
            }]
        });

        // Calculate and add data rows
        workers.forEach(worker => {
            const regularHours = worker.WorkLogs.reduce((total, log) => 
                total + Math.min(log.hours_worked, payrollRules.standard_working_hours), 0);
            
            const overtimeHours = worker.WorkLogs.reduce((total, log) => 
                total + Math.max(0, log.hours_worked - payrollRules.standard_working_hours), 0);

            const regularPay = regularHours * (worker.daily_rate / payrollRules.standard_working_hours);
            const overtimePay = overtimeHours * worker.overtime_rate;

            worksheet.addRow({
                worker_id: worker.worker_id,
                name: worker.name,
                regular_hours: regularHours,
                overtime_hours: overtimeHours,
                daily_rate: worker.daily_rate,
                overtime_rate: worker.overtime_rate,
                regular_pay: regularPay,
                overtime_pay: overtimePay,
                total_pay: regularPay + overtimePay
            });
        });

        // Add totals row
        const lastRow = worksheet.rowCount;
        worksheet.addRow({
            worker_id: 'TOTAL',
            regular_hours: { formula: `SUM(C2:C${lastRow})` },
            overtime_hours: { formula: `SUM(D2:D${lastRow})` },
            regular_pay: { formula: `SUM(G2:G${lastRow})` },
            overtime_pay: { formula: `SUM(H2:H${lastRow})` },
            total_pay: { formula: `SUM(I2:I${lastRow})` }
        });

        // Style the totals row
        worksheet.getRow(lastRow + 1).font = { bold: true };
        worksheet.getRow(lastRow + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF0B3' }
        };

        // Format number columns
        worksheet.getColumn('G').numFmt = '$#,##0.00';
        worksheet.getColumn('H').numFmt = '$#,##0.00';
        worksheet.getColumn('I').numFmt = '$#,##0.00';

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=PayrollReport.xlsx'
        );

        // Send the workbook
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Error generating Excel report:', err);
        res.status(500).json({ error: 'Failed to generate Excel report' });
    }
}; 