const { PendingRequest, LaborWorker } = require('../models');

exports.submitOvertimeRequest = async (req, res) => {
    try {
        const { worker_ids, overtime_rate, type } = req.body;

        const request = await PendingRequest.create({
            company_id: req.user.company_id,
            requested_by: req.user.id,
            request_type: type === 'group' ? 'overtime_group' : 'overtime_individual',
            request_data: {
                worker_ids,
                overtime_rate
            },
            created_at: new Date()
        });

        res.status(201).json({
            message: 'Overtime request submitted successfully',
            request
        });
    } catch (err) {
        console.error('Error submitting overtime request:', err);
        res.status(500).json({ error: 'Failed to submit overtime request' });
    }
};

exports.applyApprovedOvertime = async (req, res) => {
    try {
        const { request_id } = req.params;
        const request = await PendingRequest.findByPk(request_id);

        if (!request || request.status !== 'approved') {
            return res.status(400).json({ error: 'Invalid or unapproved request' });
        }

        const { worker_ids, overtime_rate } = request.request_data;

        await Promise.all(worker_ids.map(worker_id => 
            LaborWorker.update(
                { overtime_rate },
                { where: { id: worker_id, company_id: req.user.company_id } }
            )
        ));

        res.json({ message: 'Overtime rates applied successfully' });
    } catch (err) {
        console.error('Error applying overtime:', err);
        res.status(500).json({ error: 'Failed to apply overtime rates' });
    }
}; 