![pg analyser logo](https://github.com/radicalgeek/pg_analyser/blob/main/src/public/logo.webp?raw=true)
# pg_analyser

`pg_analyser` is a PostgreSQL database analysis tool designed to inspect and report on various aspects of database schema configuration and data usage patterns. It helps identify potential issues and optimisations to ensure the database is structured efficiently, both in terms of storage and query performance. This utility performs an array of checks across the database, providing insights into areas such as data type appropriateness and index usage, with a user-friendly web interface for initiating analysis and viewing recommendations.

## Features

`pg_analyser` conducts several types of analysis on a PostgreSQL database:

1. **Data Type Checks**: Identifies columns where the data type might not be optimal for the data stored (e.g., numeric, boolean or date data stored as text and boolean stored as numbers). 

2. **Oversized Columns** Checks for oversized character lengths and identifies the maximum data size used by a record in a column. Works for both strings and numeric precision.

3. **Index Usage and Types**: Evaluates the usage of existing indexes to identify unused or rarely used indexes that may consume unnecessary resources as well as duplicate indexes. Suggests more efficient index types where applicable (GIN indexes for type text[], BRIN indexes for large tables with monotonically increasing columns and GiST indexes for geometric data) Also ensure foreign key columns are indexed.

4. **Unused or Rarely Used Columns**: Detects columns that have a high percentage of null values or a lack of diversity in their data, which might indicate that the column is underutilised.

5. **Temporal Data Type Appropriateness**: Reviews columns with temporal data (dates and times) to ensure that the most appropriate data type is used, considering the need for time zone awareness and precision.

6. **Consistent Use of Enums**: Identifies columns that could benefit from being converted to enum types, based on the repetition of a limited set of string values.

7. **Overuse of Superuser Accounts**: Highlights superuser accounts, which have unrestricted access to the database, that may be being utilised for regular database access, potentially posing a security risk.

8. **Identification of Default User Accounts**: Scans for user accounts that appear to be unchanged defaults, which may still use predictable or widely-known passwords, presenting an easy target for unauthorised access.

9. **Comprehensive Role Permissions Review**: Analyses roles within the database to flag any with overly broad permissions, reducing the principle of least privilege and potentially exposing sensitive data or operations to a wider range of users than necessary.

10. **Enforcement of Strong Password Policies**: Evaluates the database's password policy settings to ensure strong passwords are enforced, reducing the risk of compromise through brute force or dictionary attacks.

11. **Optimal Logging and Auditing Practices**: Assesses the database's logging and auditing configurations to ensure that significant actions and transactions are properly recorded, aiding in security audits and forensic analysis.

12. **Identification of Columns with Sensitive Data**: Scans for columns that are likely to store sensitive information, such as passwords, tokens, and API keys, to ensure that appropriate security measures, like encryption and access controls, are in place.

13. **Verification of Data-in-Transit Encryption**: Checks for configurations that ensure data being transferred to and from the database is encrypted, protecting against eavesdropping and man-in-the-middle attacks.

14. **Assessment of Data-at-Rest Encryption**:  Reviews the database for indications that data stored is encrypted, safeguarding against unauthorised access to data by bypassing database security controls, such as through direct file system access.

## Getting Started

The utility can be used either at the command line or as a web application. The web application provides a user-friendly interface for initiating the analysis and viewing the results. The command-line interface is useful for scripting and automation purposes.

### CLI 

First install the package globally

```bash
npm install -g pg_analyser

```

You can then run the tool with the following command, ensuring you pass in the correct database connection details

```bash
 pg-analyser --dbHost=your_database_ip --dbUser=your_database_user --dbPassword=your_database_password --dbName=your_database_name --dbPort=5432
```

You can also run the web interface by setting the connection details using environment variable and running the following command

```bash
export PGHOST=db
export PGUSER=your_database_user
export PGDATABASE=your_database_name
export PGPASSWORD=your_database_password
pg-analyser --server

```

### Docker image

The tool is also available as a docker image. You can run the tool as a web interface using the following command

```bash
docker run -e PGUSER='your_database_user' -e PGPASSWORD='your_database_password' -e PGHOST='localhost' -e PGDATABASE='your_database_name' -e PGPORT=5432 -p 3000:3000 radicalgeek/pg_analyser
```

The repository also contains a docker compose file used for local development that could easily be adapted, and kubernetes manifests for deployment in a kubernetes cluster.

## Development

### Prerequisites

- ***Testing in docker*** Docker and Docker compose for local testing
- ***Testing localy*** PostgreSQL database installed, node.js, jest, express, pg etc...
- ***Running in K8S*** PostgreSQL database access to conduct the test. K8S manifests profided for easy deployment 

### Testing

1. Clone the repository:

```bash
git clone https://github.com/yourusername/pg_analyser.git
cd pg_analyser
```
2. copy the .env.template file to .env and adjust as needed
```bash
cp .env.template .env
```

3. start the application and a PostgreSQL instance using Docker Compose
```bash
docker-compose up -d --build
```

4. Access the service at http://localhost:3000 

5. The compose file will bring up a database with a number of misconfigured tables that the tool will identify. 

6. In addition you can run the unit tests locally with 
```bash
npm test
```

### Deployment

The project includes kubernetes manifests for running the application in a pod. A pre-built container image is avaliable on docker hub too https://hub.docker.com/repository/docker/radicalgeek/pg_analyser/general

1. Ensure your Kubernetes cluster is running and `kubectl` is configured to communicate with your cluster.

2. Edit the `manifests\deployment.yaml` file to set the `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME` and `DB_PORT` environment variables. You may need to retrive the credentials from existing secrets and set the namespace to the same namespace as the PostgreSQL instance you would like to test. 

4. Deploy pq_analyser to Kubernetes
```bash
kubectl apply -f manifests/
```

5. To access the web interface from outside the cluster, use kubectl proxy or expose the service via an Ingress controller or a LoadBalancer, depending on your cluster setup.
```bash
kubectl proxy
```

6. access the service 
```
http://localhost:8001/api/v1/namespaces/your_namespace/services/pg-analyser-service:80/proxy/

```
Make sure you replace `your_namespace` with the actual namespace of the deployment. You

### Environment variables. 

Configure database connection settings by editing the `docker-compose.yml` file or the `manifests/deplyment.yaml` file:
```
PGHOST='localhost' #the hostname of the PostgreSQL instance
PGUSER='your_database_user'
PGDATABASE='your_database_name'
PGPASSWORD='your_database_password'
PGPORT=5432

ENUM_THRESHOLD=5
UNUSED_INDEX_THRESHOLD=50
UNUSED_COLUMN_PERCENTAGE_THRESHOLD=5
```


#### ENUM_THRESHOLD
This environment variable sets the threshold for suggesting conversion of text columns to enum types based on the number of distinct values found in those columns.

Purpose: If a text column in your database has a limited set of distinct values (e.g., a status column with values like 'new', 'in progress', 'completed'), converting it to an enum type can be more efficient in terms of storage and query performance.
Usage: The ENUM_THRESHOLD value of 5 means that if a text column has 5 or fewer distinct values, the tool will suggest considering this column for conversion to an enum type.

#### UNUSED_INDEX_THRESHOLD
This environment variable sets the threshold for identifying unused or infrequently used indexes based on their usage statistics.

Purpose: Indexes are meant to improve database query performance. However, maintaining indexes also incurs overhead during write operations and uses additional storage. Identifying and removing unused or rarely used indexes can help optimise resource usage.
Usage: The UNUSED_INDEX_THRESHOLD value of 50 indicates that if an index has been scanned fewer than 50 times (indicating low usage), the tool will suggest evaluating whether this index is necessary and potentially removing it to save resources.

#### UNUSED_COLUMN_PERCENTAGE_THRESHOLD
This environment variable sets the threshold for identifying columns that are rarely used or mostly contain null values as a percentage of total rows in the table.

Purpose: Columns that are mostly unused or contain a high percentage of null values might indicate design inefficiencies in the database schema. Identifying such columns can help database administrators and developers review and possibly refactor their schema for better efficiency.
Usage: The UNUSED_COLUMN_PERCENTAGE_THRESHOLD value of 5 means that if a column has non-null values in less than 5% of its rows, the tool will flag this column as being rarely used or mostly null, suggesting a review to determine if it can be removed or its usage optimised.

## Contributing
Contributions are welcome! Just send a pull request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
This utility was designed to assist database administrators and developers in optimising their PostgreSQL databases for better performance and efficiency.

### Disclaimer
pg_analyser makes recommendations based on general best practices and observations. Always review suggested changes and test them in a development environment before applying to production databases.