import Image from "next/image";
import events from "@/demo/fixtures/events.json";

// Demo only: the original app had no events list yet, so the demo shows fixture events.
const DemoEvents = () => (
  <ul className='grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
    {events.map((e) => (
      <li key={e.id} className='flex flex-col overflow-hidden rounded-2xl bg-white shadow-md'>
        <Image src={e.image} alt={e.title} width={600} height={400} className='h-48 w-full object-cover' />
        <div className='flex flex-col gap-3 p-5'>
          <div className='flex gap-2'>
            <span className='p-semibold-14 rounded-full bg-coral-500/10 px-4 py-1 text-coral-500'>{e.price}</span>
            <span className='p-semibold-14 rounded-full bg-grey-500/10 px-4 py-1 text-grey-500'>{e.category}</span>
          </div>
          <p className='p-medium-16 text-grey-500'>{e.date}</p>
          <p className='p-medium-16 md:p-medium-20 line-clamp-2 flex-1 text-black'>{e.title}</p>
          <p className='p-medium-14 text-grey-600'>{e.location} · {e.organizer}</p>
        </div>
      </li>
    ))}
  </ul>
);

export default DemoEvents;
