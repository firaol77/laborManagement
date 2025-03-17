const { PendingRequest, CompanyAdmin, LaborWorker } = require('../models');
const { Op } = require('sequelize');

exports.createRequest = async (req, res) => {
    try {
        const { type, data } = req.body;
        
        const request = await PendingRequest.create({
            company_id: req.user.company_id,
            requested_by: req.user.id,
            request_type: type,
            request_data: data,
            status: 'pending',
            created_at: new Date()
        });

        res.status(201).json(request);
    } catch (err) {
        console.error('Error creating request:', err);
        res.status(500).json({ error: 'Failed to create request' });
    }
};

exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await PendingRequest.findAll({
            where: {
                company_id: req.user.company_id,
                status: 'pending'
            },
            include: [{
                model: CompanyAdmin,
                as: 'requester',
                attributes: ['username']
            }],
            order: [['created_at', 'DESC']]
        });

        res.json(requests);
    } catch (err) {
        console.error('Error fetching pending requests:', err);
        res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
};

exports.handleRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const request = await PendingRequest.findOne({
            where: { 
                id,
                company_id: req.user.company_id
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        await request.update({ 
            status,
            updated_at: new Date()
        });

        // If approved, process the request
        if (status === 'approved') {
            switch (request.request_type) {
                case 'new_worker':
                    await LaborWorker.create({
                        ...request.request_data,
                        company_id: req.user.company_id
                    });
                    break;
                    
                case 'overtime_individual':
                case 'overtime_group':
                    const { worker_ids, overtime_rate } = request.request_data;
                    await LaborWorker.update(
                        { overtime_rate },
                        { 
                            where: { 
                                id: { [Op.in]: worker_ids },
                                company_id: req.user.company_id
                            }
                        }
                    );
                    break;
            }
        }

        res.json({ message: `Request ${status} successfully` });
    } catch (err) {
        console.error('Error handling request:', err);
        res.status(500).json({ error: 'Failed to handle request' });
    }
};

exports.approveAllRequests = async (req, res) => {
    try {
        const pendingRequests = await PendingRequest.findAll({
            where: {
                company_id: req.user.company_id,
                status: 'pending'
            }
        });

        for (const request of pendingRequests) {
            await exports.handleRequest({
                params: { id: request.id },
                body: { status: 'approved' },
                user: req.user
            }, { json: () => {} });
        }

        res.json({ message: 'All requests approved successfully' });
    } catch (err) {
        console.error('Error approving all requests:', err);
        res.status(500).json({ error: 'Failed to approve all requests' });
    }
}; 