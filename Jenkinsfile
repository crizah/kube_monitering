// build docker image
// push to repo
// apply kubernetes files

pipeline{
    agent any

    environment{
        DOCKERHUB_CREDS = 'docker-hub-creds-global'
        USERNAME = "shaizah"
        SERVER_IMAGE = 'shaizah/kube:kube-monitering-server'
        SERVER_PATH = './server'
        WEB_IMAGE = 'shaizah/kube:kube-monitering-web'
        WEB_PATH = './ui'


    }

    stages{
        stage('checkout'){
            steps{
                checkout scm
            }
        }

        stage('build image'){
            steps{
                script{
                    docker.withRegistry('', DOCKERHUB_CREDS){
                        sh """
                        docker build -t ${SERVER_IMAGE} ${SERVER_PATH}
                        docker push ${SERVER_IMAGE}
                        docker build -t ${WEB_IMAGE} ${WEB_PATH}
                        docker push ${WEB_IMAGE}
                        """
                    }
                }
            }
        }
    }

    post{
        success {
            echo "yipee"
        }
        failure{
            echo "womp womp"
        }
    }

}