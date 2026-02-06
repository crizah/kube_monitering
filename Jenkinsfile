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

        stage('detect change since last time'){
            steps{
                def detectChange = sh(
                    script: "git diff --name-only HEAD~1 HEAD"
                    
                ).trim()
                    

                env.SERVER_CHANGED = detectChange.contains('server/') ?'true':'false'
                env.WEB_CHANGED    = detectChange.contains('ui/')?'true': 'false'
                env.K8S_CHANGED = detectChange.contains('k8s')? 'true':'false'
                
            }
        }

        stage('build image server'){
            when{
                expression {env.SERVER_CHANGED == 'true'}
            }
            steps{
                script{
                    docker.withRegistry('', DOCKERHUB_CREDS){
                        sh """
                        docker build -t ${SERVER_IMAGE} ${SERVER_PATH}
                        docker push ${SERVER_IMAGE}
                        """
                    }
                }
            }
        }

        stage('build image web'){
            when{
                expression {env.WEB_CHANGED == 'true'}
            }

            steps{
                script{
                    docker.withRegistry('', DOCKERHUB_CREDS){
                        sh """
                        docker build -t ${WEB_IMAGE} ${WEB_PATH}
                        docker push ${WEB_IMAGE}
                        """
                    }
                }
            }
        }

        stage('apply manifest files'){
            when{
                expression {env.K8S_CHANGED == 'true'}
            }
            steps{
                


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