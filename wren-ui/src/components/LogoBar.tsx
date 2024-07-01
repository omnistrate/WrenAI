import Image from 'next/image';

export default function LogoBar() {
  return (
    <Image
      src="/images/logo-white-with-text.svg"
      alt="Omnistrate AI Platform"
      width={357}
      height={45}
    />
  );
}
