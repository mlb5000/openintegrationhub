kubectl apply -f platform/namespaces.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f platform/efs/efs-provisioner.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f platform/efs/efs-rolebinding.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f platform/efs/efs-storageclass.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f platform/rabbitmq.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f platform/redis.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f platform/influxdb.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f platform/grafana.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/v1.1.2/docs/examples/rbac-role.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f platform/alb-ingress-controller.yml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f platform/ingress.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f minikube/1-Platform/2-volume.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f minikube/1-Platform/3-volumeClaim.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f platform/mongodb.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

cd services/iam
yarn
node -e "require('./src/util/keystore').generateFile()"
kubectl -n oih-dev-ns create secret generic oidc-certs --from-file=keystore.json='./keystore/keystore.json'
cd ../../

kubectl apply -f services/iam/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/iam/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/app-directory/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/app-directory/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/attachment-storage-service/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/attachment-storage-service/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/audit-log/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/audit-log/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/component-orchestrator/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/component-orchestrator/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/component-repository/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/component-repository/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/data-hub/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/data-hub/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/dispatcher-service/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/dispatcher-service/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/flow-repository/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/flow-repository/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/ils/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/ils/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/logging-service/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/logging-service/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/meta-data-repository/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/meta-data-repository/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/reports-analytics/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/reports-analytics/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/scheduler/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/scheduler/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/secret-service/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/secret-service/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/snapshots-service/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/snapshots-service/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/web-ui/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate

kubectl apply -f services/webhooks/k8s/secrets.yaml --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate
kubectl apply -f services/webhooks/k8s --cluster arn:aws:eks:us-east-1:911355339532:cluster/openintegrationhub-uiupdate


# JWT Secret 5CD8A9AF0FFC4D0D8C2B04475EE58264
# Cookie Secret 236CF3848F994AD7A36A9891960D6E4A
# Admin password 7346773B5B5F4047931973D5B116C1DA
# Service Account password B54E4D667C1F448EA9904B3085A5A4CD
# OIDC Client Secret B20FE1224600401CA311264722E2A058

# warn: Missing IAM_ACC_ADMIN_PASSWORD. This password will be auto-generated only displayed once via stdout!

#     ===============================================

#     || Auto generated password: sa07LgaHr50XhDiO ||

#     ===============================================
 
# { logger: 'check-env' }
# warn: Missing IAM_ACC_SERVICEACCOUNT_PASSWORD. This password will be auto-generated only displayed once via stdout!

#     ===============================================

#     || Auto generated password: QoHdc9CRz5mrzB28 ||

#     ===============================================
 
# { logger: 'check-env' }
# warn: Missing IAM_JWT_SECRET. This password will be auto-generated only displayed once via stdout!

#     ===============================================

#     || Auto generated password: TUwLnflmmn3stTF/ ||

#     ===============================================
 
# { logger: 'check-env' }
# warn: Missing IAM_SESSION_COOKIE_SECRET. This password will be auto-generated only displayed once via stdout!

#     ===============================================

#     || Auto generated password: 3SqS9QJKQY9/mMpK ||

#     ===============================================