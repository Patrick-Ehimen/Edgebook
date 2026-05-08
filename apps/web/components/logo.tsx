import { LogoImg } from '@/public';
import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src={LogoImg}
      alt="logo"
      className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-emerald-400 to-cyan-400 text-[13px] font-extrabold text-emerald-950"
    />
  );
}
