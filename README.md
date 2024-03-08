![pg alalyser logo](https://github.com/radicalgeek/pg_analyser/blob/main/src/logo.webp?raw=true)
# pg_analyser

`pg_analyser` is a web-based PostgreSQL database analysis tool designed to inspect and report on various aspects of database schema configuration and data usage patterns. It helps identify potential issues and optimisations to ensure the database is structured efficiently, both in terms of storage and query performance. This utility performs an array of checks across the database, providing insights into areas such as data type appropriateness and index usage, with a user-friendly web interface for initiating analysis and viewing recommendations.

## Features

`pg_analyser` conducts several types of analysis on a PostgreSQL database:

1. **Data Type Checks**: Identifies columns where the data type might not be optimal for the data stored (e.g., numeric or date data stored as text and oversized character lengths).

2. **Index Usage and Types**: Evaluates the usage of existing indexes to identify unused or rarely used indexes that may consume unnecessary resources, and suggests more efficient index types where applicable.

3. **Unused or Rarely Used Columns**: Detects columns that have a high percentage of null values or a lack of diversity in their data, which might indicate that the column is underutilized.

4. **Temporal Data Type Appropriateness**: Reviews columns with temporal data (datws and time) to ensure that the most appropriate data type is used, considering the need for time zone awareness and precision.

5. **Consistent Use of Enums**: Identifies columns that could benefit from being converted to enum types, based on the repetition of a limited set of string values.

## Getting Started

### Prerequisites

- ***Testingin docker*** Docker and Docker compose for local testing
- ***Testing localy*** PostgreSQL database installed, node.js, jest, express, pg etc...
- ***Running in K8sS*** PostgreSQL database access to conduct the test. K8S manifests profided for easy deployment 

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
docker-compose up --build
```

4. Access the service at http://localhost:3000 

5. the compose file will bring up a database with a number of misconfigured tables that the tool will identify. 

6. In addition you can run the unit tests locally with 
```bash
npm test
```

### Deployment

The project includes kubernetes manifests for running the application in a pod. 

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

Purpose: Indexes are meant to improve database query performance. However, maintaining indexes also incurs overhead during write operations and uses additional storage. Identifying and removing unused or rarely used indexes can help optimize resource usage.
Usage: The UNUSED_INDEX_THRESHOLD value of 50 indicates that if an index has been scanned fewer than 50 times (indicating low usage), the tool will suggest evaluating whether this index is necessary and potentially removing it to save resources.

#### UNUSED_COLUMN_PERCENTAGE_THRESHOLD
This environment variable sets the threshold for identifying columns that are rarely used or mostly contain null values as a percentage of total rows in the table.

Purpose: Columns that are mostly unused or contain a high percentage of null values might indicate design inefficiencies in the database schema. Identifying such columns can help database administrators and developers review and possibly refactor their schema for better efficiency.
Usage: The UNUSED_COLUMN_PERCENTAGE_THRESHOLD value of 5 means that if a column has non-null values in less than 5% of its rows, the tool will flag this column as being rarely used or mostly null, suggesting a review to determine if it can be removed or its usage optimized.

### Contributing
Contributions are welcome! Just send a pull request.

### License
This project is licensed under the MIT License - see the LICENSE file for details.

### Acknowledgments
This utility was designed to assist database administrators and developers in optimising their PostgreSQL databases for better performance and efficiency.

### Disclaimer
pg_analyser makes recommendations based on general best practices and observations. Always review suggested changes and test them in a development environment before applying to production databases.