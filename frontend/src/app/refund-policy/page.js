export const metadata = {
  title: 'Refund & Return Policy | Freshinbasket',
  description: 'Our open-box delivery and refund policy at Freshinbasket. Learn about on-the-spot returns, no post-delivery claims, and refund processing for fresh grocery orders in Bhilwara.',
};

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 pt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#216140] px-8 py-10 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Refund & Return Policy</h1>
            <p className="text-green-100 text-lg">Important information regarding your orders</p>
          </div>

          {/* Content */}
          <div className="px-8 py-10 space-y-8 text-gray-700">
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-100 text-[#216140] flex items-center justify-center text-sm">1</span>
                Open-Box Delivery
              </h2>
              <p className="leading-relaxed">
                At Freshinbasket, we prioritize transparency and freshness. That's why we strictly follow an <strong>Open-Box Delivery</strong> policy. When our delivery partner arrives with your order, you are encouraged to open the package and inspect all products before accepting the delivery.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-100 text-[#216140] flex items-center justify-center text-sm">2</span>
                On-The-Spot Returns
              </h2>
              <p className="leading-relaxed">
                If you find any fault, damage, or discrepancy in the products delivered to you, <strong>you must return them to the delivery executive immediately at the time of delivery</strong>. We will process a replacement or refund for the faulty items right away.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-100 text-[#216140] flex items-center justify-center text-sm">3</span>
                No Post-Delivery Returns
              </h2>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mt-2">
                <p className="text-red-700 font-medium">
                  Once the delivery is completed and you have accepted the order, we cannot accept any returns, exchanges, or claims for a refund.
                </p>
              </div>
              <p className="mt-4 leading-relaxed">
                Because we deal with fresh groceries and perishable items, we cannot guarantee the condition of the products once they have been handed over. By accepting the delivery from our executive, you confirm that you are satisfied with the quality and quantity of the items received.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-100 text-[#216140] flex items-center justify-center text-sm">4</span>
                Refund Processing
              </h2>
              <p className="leading-relaxed">
                If you reject a faulty item at the time of delivery:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong>Prepaid Orders:</strong> The amount for the rejected item(s) will be refunded to your original payment method within 5-7 business days.</li>
                <li><strong>Cash on Delivery (COD):</strong> The amount for the rejected item(s) will be deducted from your total bill on the spot, and you only pay for what you keep.</li>
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
