import Image from 'next/image';

export default function LogoBar() {
  return (
    <Image
      src="/images/logo-white-with-text.svg"
      alt="Couchbase iQ"
      width={231}
      height={45}
    />
  );
}
