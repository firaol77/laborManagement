const { LaborWorker } = require('../models');

exports.getWorkers = async (req, res) => {
  try {
    const workers = await LaborWorker.findAll({
      where: { company_id: req.user.company_id },
    });
    res.json(workers);
  } catch (err) {
    console.error('Error fetching workers:', err);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
};

exports.createWorker = async (req, res) => {
  try {
    const { name, bankName, accountNumber } = req.body;
    const worker = await LaborWorker.create({
      name,
      bankName,
      accountNumber,
      company_id: req.user.company_id,
      status: 'active',
    });
    res.status(201).json(worker);
  } catch (err) {
    console.error('Error creating worker:', err);
    res.status(500).json({ error: 'Failed to create worker' });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bankName, accountNumber, status } = req.body;
    const worker = await LaborWorker.findOne({
      where: { id, company_id: req.user.company_id },
    });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    await worker.update({ name, bankName, accountNumber, status });
    res.json(worker);
  } catch (err) {
    console.error('Error updating worker:', err);
    res.status(500).json({ error: 'Failed to update worker' });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await LaborWorker.findOne({
      where: { id, company_id: req.user.company_id },
    });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    await worker.destroy();
    res.json({ message: 'Worker deleted successfully' });
  } catch (err) {
    console.error('Error deleting worker:', err);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
};