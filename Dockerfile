FROM ficusio/nodejs-base:0.12

# Below is largely borrowed from:
# https://github.com/ficusio/docker-nodejs/blob/master/runtime/Dockerfile

MAINTAINER oli@olimcc.com

WORKDIR /app
COPY package.json /app/

# Install NPM deps first to allow reusing of Docker image cache when package.json
# is not changed:
#
# 1. install development deps that might be needed to compile binary Node.js modules;
# 2. install NPM-managed application deps, but don't install devDependencies;
# 3. remove development deps from step 1;
# 4. clear various NPM caches.
#
RUN deps="make gcc g++ python musl-dev" \
 && apk update \
 && apk add bash $deps \
 && npm install --production \
 && apk del $deps \
 && rm -rf /var/cache/apk/* \
 && npm cache clean \
 && rm -rf ~/.node-gyp /tmp/npm*

# Copy app files to a temporary dir to prevent just installed /app/node_modules
# from getting overwritten by the ones copied from developer's machine.
#
COPY . /tmp/app/

# Move app files from the temporary dir to WORKDIR.
#
# Bash and dotglob are here to move all files, including hidden ones.
# Which is surprisingly non-obvious operation.
#
RUN bash -c 'shopt -s dotglob \
 && rm -rf /tmp/app/{node_modules,Dockerfile} \
 && cp -pRf /tmp/app/* /app/ \
 && rm -rf /tmp/app'

EXPOSE 3000

CMD ["node", "/app/nodeserver.js"]
