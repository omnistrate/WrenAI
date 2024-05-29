import Image from 'next/image';

export default function LogoBar() {
  return (
    <Image
      src="/images/logo-white-with-text.svg"
      alt="Couchbase IQ"
      width={198}
      height={45}
    />
  );
}
