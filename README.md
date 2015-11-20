Crude deployment of unversioned docker images:

    ./build.sh
    scp build/quickdraw-app.docker.tgz some-host:

To install (on host):

    gunzip quickdraw-app.docker.tgz
    docker load -i quickdraw-app.docker.tar
    docker run -d -p 3000:3000 quickdraw-app
