const { TransactionManager } = require('../database/TransactionManager');
const DummyPaymentRepository = require('../repositories/DummyPaymentRepository');
const EventBus = require('../events/EventBus'); // Conceptual

class DummyPaymentService {
  async processPayment(jobOrderId, amount, user, existingTx = null) {
    // Standard Execution: Uses TransactionManager, optionally passing existing context
    return TransactionManager.execute(async (txContext) => {
      
      // 1. Read Domain State (using active txContext)
      const job = DummyPaymentRepository.getJobOrder(jobOrderId, txContext);
      if (!job) throw new Error('Job Order not found');
      
      const remaining = job.total_invoice - job.total_paid;
      if (amount > remaining) throw new Error('Business Rule Error: Amount exceeds remaining balance');

      // 2. Execute Mutations (using active txContext)
      DummyPaymentRepository.insertPayment(jobOrderId, amount, user.id, txContext);
      DummyPaymentRepository.updateJobOrderPaid(jobOrderId, amount, txContext);
      
      // 3. Register Domain Event (strictly executes POST-COMMIT)
      txContext.onCommit(() => {
        console.log(`PaymentCompleted Event Published for JO: ${jobOrderId} (Tx: ${txContext.transactionId})`);
        // EventBus.publish('PaymentCompleted', { jobOrderId, amount });
      });

      return { success: true, message: 'Payment applied' };
    }, existingTx);
  }
}

module.exports = new DummyPaymentService();
