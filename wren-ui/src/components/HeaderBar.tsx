import { useRouter } from 'next/router';
import { Button, Layout, Space } from 'antd';
import styled from 'styled-components';
import LogoBar from '@/components/LogoBar';
import { Path } from '@/utils/enum';
import Deploy from '@/components/deploy/Deploy';

const { Header } = Layout;

const StyledButton = styled(Button)<{ $isHighlight: boolean }>`
  background: ${(props) => (props.$isHighlight ? '#4c4c4c' : 'transparent')};
  letter-spacing: 0.5px;
  font-weight: 500;
  border: none;
  color: #e5e5e5;
  cursor: pointer;
  &:hover,
  &:focus {
    background: #4c4c4c;
    color: #e5e5e5;
  }
`;

const StyledHeader = styled(Header)`
  height: 84px;
  border-bottom: 1px solid var(--gray-5);
  background: #000;
  padding: 20px;
`;

export default function HeaderBar() {
  const router = useRouter();
  const { pathname } = router;
  const showNav = !pathname.startsWith(Path.Onboarding);
  const isModeling = pathname.startsWith(Path.Modeling);

  return (
    <StyledHeader>
      <div
        className="d-flex justify-space-between align-center"
        style={{ marginTop: -2 }}
      >
        <Space size={[48, 0]}>
          <LogoBar />
          {showNav && (
            <Space size={[16, 0]}>
              <StyledButton
                size="large"
                $isHighlight={pathname.startsWith(Path.Home)}
                onClick={() => router.push(Path.Home)}
              >
                Home
              </StyledButton>
              <StyledButton
                size="large"
                $isHighlight={pathname.startsWith(Path.Modeling)}
                onClick={() => router.push(Path.Modeling)}
              >
                Modeling
              </StyledButton>
            </Space>
          )}
        </Space>
        {isModeling && (
          <Space size={[16, 0]}>
            <Deploy />
          </Space>
        )}
      </div>
    </StyledHeader>
  );
}
