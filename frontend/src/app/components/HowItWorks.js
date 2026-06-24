import { Smartphone, ShoppingCart, Leaf } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <Smartphone size={40} className="text-purple-600" />,
      bg: "bg-purple-100",
      title: "Open the app",
      description: "Choose from over 7000 products across groceries, fresh fruits & veggies, meat, pet care, beauty items & more"
    },
    {
      icon: <ShoppingCart size={40} className="text-pink-500" />,
      bg: "bg-pink-100",
      title: "Place an order",
      description: "Add your favourite items to the cart & avail the best offers"
    },
    {
      icon: <Leaf size={40} className="text-green-500" />,
      bg: "bg-green-100",
      title: "Get Fresh fruits and vegetables",
      description: "Experience lighting-fast speed & get all your items delivered in minutes"
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 mb-10">
        How it Works
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 ${step.bg}`}>
              {step.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              {step.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
