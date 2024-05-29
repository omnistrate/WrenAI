import { useEffect } from 'react';
import { Button, Space, Typography, message } from 'antd';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import { SyncStatus } from '@/apollo/client/graphql/__types__';
import { useDeployMutation } from '@/apollo/client/graphql/deploy.generated';
import { useDeployStatusContext } from '@/components/deploy/Context';
import styled from 'styled-components';

const StyledButton = styled(Button)<{ $isDisabled: boolean }>`
  background: ${(props) => (props.$isDisabled ? '#4c4c4c' : '#4c4c4c')};
  font-weight: 500;
  border: none;
  color: #e5e5e5;
  cursor: ${(props) => (props.$isDisabled ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.$isDisabled ? 0.6 : 1)};
  letter-spacing: 0.5px;

  &:hover,
  &:focus {
    background: ${(props) =>
      props.$isDisabled ? '#979797' : '#4c4c4c'} !important;
    color: ${(props) => (props.$isDisabled ? '#fff' : '#ffffff')} !important;
  }

  &:disabled {
    background: #4c4c4c;
    color: #e5e5e5;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const { Text } = Typography;

const getDeployStatus = (deploying: boolean, status: SyncStatus) => {
  const syncStatus = deploying ? SyncStatus.IN_PROGRESS : status;

  return (
    {
      [SyncStatus.IN_PROGRESS]: (
        <Space size={[4, 0]} className="p-3">
          <LoadingOutlined className="mr-1 gray-1" />
          <Text className="gray-1">Deploying...</Text>
        </Space>
      ),
      [SyncStatus.SYNCRONIZED]: (
        <Space size={[4, 0]} className="p-3">
          <CheckCircleOutlined className="mr-1 gray-1" />
          <Text className="gray-1">Synced</Text>
        </Space>
      ),
      [SyncStatus.UNSYNCRONIZED]: (
        <Space size={[4, 0]} className="p-3">
          <WarningOutlined className="mr-1 gold-6" />
          <Text className="gray-1">Undeployed changes</Text>
        </Space>
      ),
    }[syncStatus] || ''
  );
};

export default function Deploy() {
  const deployContext = useDeployStatusContext();
  const { data, loading, startPolling, stopPolling } = deployContext;

  const [deployMutation, { data: deployResult, loading: deploying }] =
    useDeployMutation({
      onCompleted: (data) => {
        if (data.deploy?.status === 'FAILED') {
          console.error('Failed to deploy - ', data.deploy?.error);
          message.error(
            'Failed to deploy. Please check the log for more details.',
          );
        }
      },
    });

  useEffect(() => {
    // Stop polling deploy status if deploy failed
    if (
      deployResult?.deploy?.status === 'FAILED' &&
      data?.modelSync.status === SyncStatus.UNSYNCRONIZED
    ) {
      stopPolling();
    }
  }, [deployResult, data]);

  const syncStatus = data?.modelSync.status;

  const onDeploy = () => {
    deployMutation();
    startPolling(1000);
  };

  useEffect(() => {
    if (syncStatus === SyncStatus.SYNCRONIZED) stopPolling();
  }, [syncStatus]);

  const disabled =
    deploying ||
    loading ||
    [SyncStatus.SYNCRONIZED, SyncStatus.IN_PROGRESS].includes(syncStatus);

  return (
    <Space size={[8, 0]}>
      {getDeployStatus(deploying, syncStatus)}
      <StyledButton
        $isDisabled={disabled}
        disabled={disabled}
        onClick={() => onDeploy()}
        size="large"
      >
        Deploy
      </StyledButton>
    </Space>
  );
}
